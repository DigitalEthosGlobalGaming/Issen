"""Remove redundant PBR map images while recording exact replacement values."""
import argparse
import json
from io import BytesIO
from pathlib import Path
import zipfile

from PIL import Image

SCALARS = ("roughness", "metallic", "ao")


def redundant_maps(maps):
    constants = {}
    colour = maps["diffuse"]
    emission = maps.get("emissive")
    if emission is not None:
        if emission.size != colour.size:
            raise ValueError("Emission dimensions differ from diffuse")
        alpha = colour.getchannel("A").tobytes()
        rgb = emission.convert("RGB").tobytes()
        if not any(a and any(rgb[i * 3:i * 3 + 3]) for i, a in enumerate(alpha)):
            constants["emissive"] = [0, 0, 0]
    for kind in SCALARS:
        image = maps.get(kind)
        if image is None:
            continue
        if image.size != colour.size:
            raise ValueError(f"{kind} dimensions differ from diffuse")
        channel = image.getchannel("R")
        low, high = channel.getextrema()
        # Existing browser surface packing reads R after Canvas alpha processing.
        # Only opaque constants or exact black data can be replaced losslessly.
        if low == high and (low == 0 or image.getchannel("A").getextrema() == (255, 255)):
            constants[kind] = low
    return constants


def reconstructed_map(kind, value, size):
    if kind == "emissive" and value == [0, 0, 0]:
        return Image.new("RGBA", size, (0, 0, 0, 255))
    if kind in SCALARS and type(value) is int and 0 <= value <= 255:
        return Image.new("RGBA", size, (value, value, value, 255))
    raise ValueError(f"Invalid omitted-map replacement: {kind}")


def clean_archive(archive_path):
    """Rewrites only declared PBR PNG members; preserves unrelated archive entries."""
    archive = Path(archive_path)
    metadata_path = Path(str(archive) + ".json")
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    with zipfile.ZipFile(archive) as original:
        if original.testzip() is not None:
            raise ValueError("ZIP checksum failure")
        if len(set(original.namelist())) != len(original.namelist()):
            raise ValueError("Duplicate ZIP member names")
        members = {info.filename: (info, original.read(info.filename)) for info in original.infolist()}
    diffuse_names = [name for name in members if name.endswith("_diffuse.png")]
    if len(diffuse_names) != 1:
        raise ValueError("Expected one diffuse map in PBR export")
    diffuse_name = diffuse_names[0]
    stem = diffuse_name.removesuffix("_diffuse.png")
    maps = {kind: Image.open(BytesIO(members[f"{stem}_{kind}.png"][1])).convert("RGBA")
            for kind in ("diffuse", "normal", "emissive", *SCALARS) if f"{stem}_{kind}.png" in members}
    for kind in ("normal", "emissive", *SCALARS):
        if kind not in maps:
            if kind not in metadata.get("omittedMaps", {}):
                raise ValueError(f"Missing {kind} map without omission metadata")
            reconstructed_map(kind, metadata["omittedMaps"][kind], maps["diffuse"].size)
        elif maps[kind].size != maps["diffuse"].size:
            raise ValueError(f"{kind} dimensions differ from diffuse")
    retained_constants = {kind: value for kind, value in metadata.get("omittedMaps", {}).items()
                          if f"{stem}_{kind}.png" not in members}
    constants = {**retained_constants, **redundant_maps(maps)}
    removed = []
    for kind in constants:
        reconstructed_map(kind, constants[kind], maps["diffuse"].size)
        name = f"{stem}_{kind}.png"
        if name in members:
            del members[name]
            removed.append(name)
    metadata["mapCleanupVersion"] = 1
    metadata["omittedMaps"] = constants
    # Publish replacement values first. If replacement fails, the original ZIP
    # still contains the maps; the installer prefers those real pixels.
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    if removed:
        temporary = archive.with_name(archive.name + ".cleanup.partial")
        try:
            with zipfile.ZipFile(temporary, "w") as result:
                for info, data in members.values():
                    result.writestr(info, data)
            # Validate the complete replacement before discarding the old archive.
            with zipfile.ZipFile(temporary) as result:
                if result.testzip() is not None:
                    raise ValueError("Cleaned ZIP checksum failure")
            temporary.replace(archive)
        finally:
            temporary.unlink(missing_ok=True)
    return removed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive")
    args = parser.parse_args()
    print(json.dumps({"removed": clean_archive(args.archive)}))
