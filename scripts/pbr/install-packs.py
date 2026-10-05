"""Install validated catalog exports. Requires Python 3 and Pillow."""
import hashlib
import json
import os
import subprocess
import sys
import zipfile
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[2]
CATALOG = json.loads((ROOT / "scripts/pbr/asset-packs.json").read_text(encoding="utf-8"))
KINDS = ("diffuse", "normal", "roughness", "metallic", "ao", "emissive")
REPORT = ROOT / "tmp/pbr-inventory/install-report.json"
results = []
for job in CATALOG["assets"]:
    try:
        source = (ROOT / job["source"]).resolve()
        output = (ROOT / job["output"]).resolve()
        source.relative_to(ROOT)
        output.relative_to(ROOT)
        original = Image.open(source).convert("RGBA")
        source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
        exports, provenance = {}, {}
        presets = dict.fromkeys([job["preset"]] + [part["preset"] for part in job.get("compositions", [])])
        for preset in presets:
            archive = ROOT / "tmp/pbr-inventory" / Path(job["source"]).parent / f"{source.name}_{preset}_pbr_pack.zip"
            manifest = json.loads(Path(str(archive) + ".json").read_text(encoding="utf-8"))
            assert manifest["sourceHash"] == source_hash, "Source changed since export"
            requested = json.loads((ROOT / f"scripts/pbr/presets/{preset}.pbr.json").read_text(encoding="utf-8"))
            skipped = set(requested["settings"]) & {"bevelWidth", "bevelHeight", "detail"} if job["mode"] == "texture" else set()
            assert set(manifest["actual"]["skipped"]) == skipped, "Unexpected skipped settings"
            expected = {key: value for key, value in requested["settings"].items() if key not in skipped}
            assert manifest["actual"]["applied"] == expected, "Preset settings mismatch"
            assert manifest["actual"]["mode"] == job["mode"], "Mode mismatch"
            assert manifest["actual"]["engine"] == "opengl", "Normal convention mismatch"
            with zipfile.ZipFile(archive) as z:
                assert z.testzip() is None, "ZIP checksum failure"
                maps = {kind: Image.open(BytesIO(z.read(f"{source.stem}_{kind}.png"))).convert("RGBA") for kind in KINDS}
            assert all(image.size == original.size for image in maps.values()), "Map dimensions mismatch"
            assert ImageChops.difference(original.getchannel("A"), maps["diffuse"].getchannel("A")).getbbox() is None, "Diffuse alpha changed"
            exports[preset] = maps
            provenance[preset] = {"jobHash": manifest["jobHash"], "actual": manifest["actual"], "preset": manifest["preset"]}
        final = {kind: exports[job["preset"]][kind].copy() for kind in KINDS}
        for part in job.get("compositions", []):
            x, y, w, h = part["frame"]
            assert x >= 0 and y >= 0 and w > 0 and h > 0 and x + w <= original.width and y + h <= original.height, "Composition outside atlas"
            for kind in KINDS:
                final[kind].paste(exports[part["preset"]][kind].crop((x, y, x + w, y + h)), (x, y))
        output.mkdir(parents=True, exist_ok=True)
        for kind, image in final.items():
            image.save(output / f"{source.stem}_{kind}.png")
        metadata = {**job, "generated": datetime.now(timezone.utc).date().isoformat(), "sourceHash": source_hash,
                    "dimensions": list(original.size), "renderer": "not connected", "exports": provenance}
        (output / "generation.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
        source_link = Path(os.path.relpath(source, output)).as_posix()
        tool_link = Path(os.path.relpath(ROOT / "scripts/pbr/README.md", output)).as_posix()
        used = ", ".join(f"`{preset}`" for preset in presets)
        text = f"# {source.stem} PBR pack\n\nGenerated from [{source.name}]({source_link}) with {used}, {job['mode'].title()}/OpenGL.\n\n"
        text += f"Six aligned {original.width}×{original.height} maps: diffuse, normal, roughness, metallic, AO and emissive. Original diffuse alpha is retained.\n\n"
        text += "Maps: " + ", ".join(f"[{kind}]({source.stem}_{kind}.png)" for kind in KINDS) + ".\n\n"
        text += "Exact settings and provenance: [generation.json](generation.json).\n\n"
        text += "Generated and installed; renderer lighting is not connected by this pack. Visual review is pending. Source artwork is unchanged.\n\n"
        if job.get("compositions"):
            text += "Frame compositions and exact settings are recorded in [generation.json](generation.json). All other pixels use the base preset.\n\n"
        else:
            text += "This is a material starting point. Mixed artwork uses the dominant preset; individual material regions may need refinement before wiring.\n\n"
        if job.get("note"):
            text += job["note"] + "\n\n"
        text += f"Exports passed ZIP integrity, dimensions, applied-setting and diffuse-alpha checks. See [PBR tool instructions]({tool_link}).\n"
        (output / "README.md").write_text(text, encoding="utf-8")
        results.append({"source": job["source"], "output": job["output"], "status": "installed"})
        print(f"INSTALLED {job['source']}")
    except Exception as error:
        results.append({"source": job["source"], "status": "failed", "error": str(error)})
        print(f"FAIL {job['source']}: {error}", file=sys.stderr)
REPORT.parent.mkdir(parents=True, exist_ok=True)
REPORT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
failed = sum(job["status"] == "failed" for job in results)
print(f"{len(results) - failed}/{len(results)} packs installed; {failed} failed.")
if not failed:
    subprocess.run(["node", "scripts/pbr/pack-surfaces.mjs"], cwd=ROOT, check=True)
sys.exit(1 if failed else 0)
