"""Deterministic aligned sprite packing. Requires Python 3 and Pillow.

Input rectangles are authoritative logical windows, not inferred components.
Trimming uses every nonzero alpha pixel and preserves logical dimensions/pivots.
"""
import argparse
import hashlib
import json
import re
import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
VERSION = 1


def inside(rect, outer):
    x, y, w, h = rect
    ox, oy, ow, oh = outer
    return x >= ox and y >= oy and x + w <= ox + ow and y + h <= oy + oh


def split_free(free, used):
    """MaxRects free-space subdivision, with deterministic containment pruning."""
    ux, uy, uw, uh = used
    result = []
    for x, y, w, h in free:
        if ux >= x + w or ux + uw <= x or uy >= y + h or uy + uh <= y:
            result.append((x, y, w, h))
            continue
        if ux > x:
            result.append((x, y, ux - x, h))
        if ux + uw < x + w:
            result.append((ux + uw, y, x + w - ux - uw, h))
        if uy > y:
            result.append((x, y, w, uy - y))
        if uy + uh < y + h:
            result.append((x, uy + uh, w, y + h - uy - uh))
    unique = sorted(set(result))
    return [r for r in unique if not any(r != other and inside(r, other) for other in unique)]


def layout(sprites, size=2048, padding=2, page_width=None):
    if not isinstance(size, int) or size <= 0 or not isinstance(padding, int) or padding < 1:
        raise ValueError("Page size must be positive and padding at least one pixel")
    if len({s["id"] for s in sprites}) != len(sprites):
        raise ValueError("Duplicate sprite ID")
    pages, placed = [], {}
    page_width = size if page_width is None else page_width
    ordered = sorted(sprites, key=lambda s: (-max(s["size"]), -s["size"][0] * s["size"][1], s["id"]))
    for sprite in ordered:
        w, h = sprite["size"]
        if not isinstance(w, int) or not isinstance(h, int) or min(w, h) <= 0:
            raise ValueError("Sprite dimensions must be positive integers")
        w, h = w + padding * 2, h + padding * 2
        if w > page_width or h > size:
            raise ValueError(f"Sprite {sprite['id']} exceeds page size including padding")
        candidates = []
        for page, free in enumerate(pages):
            for x, y, fw, fh in free:
                if w <= fw and h <= fh:
                    candidates.append((min(fw - w, fh - h), max(fw - w, fh - h), page, y, x))
        if candidates:
            _, _, page, y, x = min(candidates)
        else:
            page, x, y = len(pages), 0, 0
            pages.append([(0, 0, page_width, size)])
        pages[page] = split_free(pages[page], (x, y, w, h))
        placed[sprite["id"]] = {"page": page, "frame": [x + padding, y + padding, w - padding * 2, h - padding * 2]}
    return placed


def repository_path(value):
    resolved = (ROOT / value).resolve()
    resolved.relative_to(ROOT)
    return resolved


def dependency_layout(sprites, dependencies, groups, size, padding):
    """Seed by observed co-use, then merge clusters only when loading area improves.

    These are build hints, never ownership restrictions or sprite namespaces.
    Every ID retains exactly one entry regardless of how many consumers use it.
    """
    if not groups:
        return layout(sprites, size, padding)
    if any(group not in dependencies for group in groups):
        raise ValueError("Unknown packing dependency group")
    usage = [set(dependencies[group]) for group in sorted(set(groups))]
    buckets = {}
    for sprite in sprites:
        signature = tuple(index for index, ids in enumerate(usage) if sprite["id"] in ids)
        buckets.setdefault(signature, []).append(sprite)
    clusters = [buckets[key] for key in sorted(buckets)]

    def pack_and_cost(members):
        minimum = max(sprite["size"][0] + padding * 2 for sprite in members)
        widths = {size, *[value for value in (512, 768, 1024, 1280, 1536) if minimum <= value <= size],
                  *[minimum * count for count in range(1, 5) if minimum * count <= size]}
        candidates = [score_layout(members, layout(members, size, padding, width)) for width in sorted(widths)]
        return min(candidates, key=lambda result: (result[1], len(set(value["page"] for value in result[0].values()))))

    def score_layout(members, positions):
        cost = 0
        for page in set(value["page"] for value in positions.values()):
            entries = {key: value for key, value in positions.items() if value["page"] == page}
            width = max(value["frame"][0] + value["frame"][2] + padding for value in entries.values())
            height = max(value["frame"][1] + value["frame"][3] + padding for value in entries.values())
            # A small storage cost discourages fragmentation without dominating active groups.
            planes = {kind for sprite in members if sprite["id"] in entries
                      for kind in sprite.get("maps", {"colour": None})}
            cost += width * height * len(planes) * (0.1 + sum(bool(ids.intersection(entries)) for ids in usage))
        return positions, cost

    packed = [pack_and_cost(cluster) for cluster in clusters]
    while True:
        improvements = []
        for a in range(len(clusters)):
            for b in range(a + 1, len(clusters)):
                combined = pack_and_cost(clusters[a] + clusters[b])
                saving = packed[a][1] + packed[b][1] - combined[1]
                if saving > 0:
                    improvements.append((-saving, a, b, combined))
        if not improvements:
            break
        _, a, b, combined = min(improvements, key=lambda item: item[:3])
        clusters[a] += clusters.pop(b)
        packed[a] = combined
        packed.pop(b)
    result, offset = {}, 0
    for positions, _ in packed:
        for key, value in positions.items():
            result[key] = {**value, "page": value["page"] + offset}
        offset += max((value["page"] for value in positions.values()), default=-1) + 1
    return result


def extrude(page, image, x, y, padding):
    """Duplicate edge pixels without alpha compositing or changing data values."""
    w, h = image.size
    page.paste(image, (x, y))
    page.paste(image.crop((0, 0, w, 1)).resize((w, padding)), (x, y - padding))
    page.paste(image.crop((0, h - 1, w, h)).resize((w, padding)), (x, y + h))
    page.paste(image.crop((0, 0, 1, h)).resize((padding, h)), (x - padding, y))
    page.paste(image.crop((w - 1, 0, w, h)).resize((padding, h)), (x + w, y))
    for sx, sy, dx, dy in [(0, 0, x - padding, y - padding), (w - 1, 0, x + w, y - padding),
                           (0, h - 1, x - padding, y + h), (w - 1, h - 1, x + w, y + h)]:
        page.paste(image.crop((sx, sy, sx + 1, sy + 1)).resize((padding, padding)), (dx, dy))


def compile_pack(spec, output, size=2048, padding=2):
    if spec.get("version") != VERSION:
        raise ValueError("Unsupported input schema")
    cache, sprites = {}, []
    for entry in spec["sprites"]:
        maps = {}
        for kind, filename in entry["maps"].items():
            source = repository_path(filename)
            if source not in cache:
                cache[source] = Image.open(source).convert("RGBA")
            maps[kind] = cache[source]
        if "colour" not in maps:
            raise ValueError(f"Missing colour for {entry['id']}")
        if any(image.size != maps["colour"].size for image in maps.values()):
            raise ValueError(f"Unaligned maps for {entry['id']}")
        frame = entry["frame"]
        if len(frame) != 4 or any(type(v) not in (int, float) or not math.isfinite(v) for v in frame):
            raise ValueError("Source frame must contain four finite numbers")
        x, y, w, h = frame
        if min(w, h) <= 0 or not inside(frame, (0, 0, *maps["colour"].size)):
            raise ValueError(f"Frame outside source for {entry['id']}")
        origin_x, origin_y = math.floor(x), math.floor(y)
        end_x, end_y = math.ceil(x + w), math.ceil(y + h)
        window = maps["colour"].crop((origin_x, origin_y, end_x, end_y))
        bounds = window.getchannel("A").getbbox()
        empty = bounds is None
        # Keep one transparent texel for an empty logical sprite.
        bounds = bounds or (0, 0, 1, 1)
        left, top, right, bottom = bounds
        # Retain a filter-support border from the declared source window.
        if not empty:
            left, top = max(0, left - padding), max(0, top - padding)
            right, bottom = min(window.width, right + padding), min(window.height, bottom + padding)
        crops = {kind: image.crop((origin_x + left, origin_y + top, origin_x + right, origin_y + bottom)) for kind, image in maps.items()}
        if empty:
            crops = {kind: Image.new("RGBA", (1, 1)) for kind in maps}
        emission = crops.get("emissive")
        if emission is not None:
            visible = crops["colour"].getchannel("A")
            pixels = emission.convert("RGB").tobytes()
            if not any(a and any(pixels[i * 3:i * 3 + 3]) for i, a in enumerate(visible.tobytes())):
                del crops["emissive"]
        pivot = entry.get("pivot", [w / 2, h / 2])
        if len(pivot) != 2 or any(not isinstance(v, (int, float)) for v in pivot):
            raise ValueError("Pivot must contain two numbers")
        sample_left, sample_top = max(x, origin_x + left), max(y, origin_y + top)
        sample_right, sample_bottom = min(x + w, origin_x + right), min(y + h, origin_y + bottom)
        sampled = [sample_left - origin_x - left, sample_top - origin_y - top,
                   max(0, sample_right - sample_left), max(0, sample_bottom - sample_top)]
        sprites.append({"id": entry["id"], "size": [right - left, bottom - top], "logicalSize": [w, h],
                        "sourceFrame": frame, "trim": [sample_left - x, sample_top - y],
                        "sampling": sampled, "pivot": pivot, "empty": empty,
                        "maps": crops, "source": entry["maps"], **({"slice": entry["slice"]} if "slice" in entry else {})})
    positions = dependency_layout(sprites, spec.get("dependencies", {}), spec.get("packingGroups", []), size, padding)
    for name, ids in spec.get("dependencies", {}).items():
        if not isinstance(ids, list) or any(sprite_id not in positions for sprite_id in ids):
            raise ValueError(f"Unknown sprite dependency in {name}")
    output = repository_path(output)
    output.mkdir(parents=True, exist_ok=True)
    previous = output / "manifest.json"
    previous_files = set()
    if previous.exists():
        old = json.loads(previous.read_text(encoding="utf-8"))
        if old.get("version") != VERSION:
            raise ValueError("Cannot overwrite output with a different schema")
        previous_files = {filename for page in old["pages"] for filename in page["maps"].values()}
        if any(not re.fullmatch(r"page-\d+-(colour|normal|surface|emissive)\.png", name) for name in previous_files):
            raise ValueError("Unsafe generated output filename")
    pages, metadata = [], {}
    count = max((p["page"] for p in positions.values()), default=-1) + 1
    for page in range(count):
        members = [s for s in sprites if positions[s["id"]]["page"] == page]
        width = max(positions[s["id"]]["frame"][0] + s["size"][0] + padding for s in members)
        height = max(positions[s["id"]]["frame"][1] + s["size"][1] + padding for s in members)
        planes = {}
        for kind in sorted({k for s in members for k in s["maps"]}):
            plane = Image.new("RGBA", (width, height))
            for sprite in members:
                crop = sprite["maps"].get(kind)
                if crop is not None:
                    x, y, w, h = positions[sprite["id"]]["frame"]
                    extrude(plane, crop, x, y, padding)
                    # Verify exact placement pixels without relying on visual inspection.
                    if plane.crop((x, y, x + w, y + h)).tobytes() != crop.tobytes():
                        raise ValueError("Packed pixels differ from input")
            filename = f"page-{page}-{kind}.png"
            if (output / filename).resolve() in cache:
                raise ValueError("Packed output must not overwrite an authoring input")
            plane.save(output / filename)
            planes[kind] = filename
        pages.append({"size": [width, height], "maps": planes,
                      "storedSpritePixels": sum(s["size"][0] * s["size"][1] for s in members),
                      "nonzeroColourPixels": sum(sum(s["maps"]["colour"].getchannel("A").histogram()[1:]) for s in members)})
    for sprite in sorted(sprites, key=lambda s: s["id"]):
        metadata[sprite["id"]] = {k: v for k, v in sprite.items() if k not in ("maps", "size", "source", "sampling")}
        metadata[sprite["id"]].update(positions[sprite["id"]])
        px, py, _, _ = positions[sprite["id"]]["frame"]
        sx, sy, sw, sh = sprite["sampling"]
        metadata[sprite["id"]]["storageFrame"] = positions[sprite["id"]]["frame"]
        metadata[sprite["id"]]["frame"] = [px + sx, py + sy, sw, sh]
        metadata[sprite["id"]]["planes"] = sorted(sprite["maps"])
    source_paths = set(cache) | {repository_path(value) for value in spec.get("configurationSources", [])}
    sources = {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(source_paths)}
    page_hashes = {filename: hashlib.sha256((output / filename).read_bytes()).hexdigest()
                   for page in pages for filename in page["maps"].values()}
    manifest = {"version": VERSION, "padding": padding, "rotation": False, "mipmaps": False,
                "sources": sources, "pageHashes": page_hashes, "pages": pages, "sprites": metadata,
                "dependencies": {name: sorted(set(ids)) for name, ids in sorted(spec.get("dependencies", {}).items())}}
    manifest["collections"] = spec.get("collections", {})
    manifest["loadingReport"] = {}
    for name, ids in manifest["dependencies"].items():
        required_pages = sorted({metadata[sprite_id]["page"] for sprite_id in ids})
        files = [filename for index in required_pages for filename in pages[index]["maps"].values()]
        manifest["loadingReport"][name] = {
            "pages": required_pages, "imageCount": len(files),
            "encodedBytes": sum((output / filename).stat().st_size for filename in files),
            "loadedPlanePixels": sum(pages[index]["size"][0] * pages[index]["size"][1] * len(pages[index]["maps"])
                                     for index in required_pages),
            "requiredSpritePlanePixels": sum(metadata[sprite_id]["frame"][2] * metadata[sprite_id]["frame"][3] *
                                             len(metadata[sprite_id]["planes"]) for sprite_id in ids),
        }
    manifest["fingerprint"] = hashlib.sha256(json.dumps({"spec": spec, "sources": sources, "size": size,
                                                        "padding": padding, "version": VERSION}, sort_keys=True).encode()).hexdigest()
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    current_files = {filename for page in pages for filename in page["maps"].values()}
    for filename in previous_files - current_files:
        target = (output / filename).resolve()
        target.relative_to(output)
        if target in cache:
            raise ValueError("Cannot remove an authoring input")
        target.unlink(missing_ok=True)
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Repository-relative sprite specification JSON")
    parser.add_argument("--output", required=True, help="Repository-relative output folder")
    parser.add_argument("--size", type=int, default=2048)
    parser.add_argument("--padding", type=int, default=2)
    args = parser.parse_args()
    manifest = compile_pack(json.loads(repository_path(args.input).read_text(encoding="utf-8")), args.output, args.size, args.padding)
    print(f"Packed {len(manifest['sprites'])} sprites into {len(manifest['pages'])} aligned pages.")
