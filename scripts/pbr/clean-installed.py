"""Apply omission metadata and remove redundant installed maps from catalog packs."""
import hashlib
import json
from pathlib import Path
from PIL import Image
from map_cleanup import redundant_maps

ROOT = Path(__file__).resolve().parents[2]
catalog = json.loads((ROOT / "scripts/pbr/asset-packs.json").read_text(encoding="utf-8"))
removed = []
for job in [*catalog["assets"], *catalog.get("installed", [])]:
    source = (ROOT / job["source"]).resolve()
    output = (ROOT / job["output"]).resolve()
    source.relative_to(ROOT)
    output.relative_to(ROOT)
    stem = source.stem
    metadata_path = output / f"{stem}.material.json"
    metadata = json.loads(metadata_path.read_text(encoding="utf-8")) if metadata_path.exists() else dict(job)
    omissions = metadata.get("omittedMaps", {})
    maps = {}
    for kind in ["diffuse", "emissive", "roughness", "metallic", "ao"]:
        filename = output / f"{stem}_{kind}.png"
        if filename.exists():
            maps[kind] = Image.open(filename).convert("RGBA")
        elif kind not in omissions:
            raise ValueError(f"Map missing without omission metadata: {filename.relative_to(ROOT)}")
    omissions = {**{kind: value for kind, value in omissions.items() if kind not in maps}, **redundant_maps(maps)}
    metadata.update({"dimensions": list(maps["diffuse"].size), "omittedMaps": omissions,
                     "mapCleanupVersion": 1, "sourceHash": hashlib.sha256(source.read_bytes()).hexdigest()})
    # Publish replacement constants before removing the exact named generated files.
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    for kind in omissions:
        if kind not in ["emissive", "roughness", "metallic", "ao"]:
            raise ValueError("Unsupported omitted map kind")
        filename = output / f"{stem}_{kind}.png"
        if filename.exists():
            removed.append({"path": filename.relative_to(ROOT).as_posix(), "bytes": filename.stat().st_size})
            filename.unlink()
    readme = output / "README.md"
    if readme.exists():
        text = readme.read_text(encoding="utf-8")
        for kind in omissions:
            text = text.replace(f"[{kind}]({stem}_{kind}.png)", f"{kind} constant (see `{stem}.material.json`)")
        note = f"\nRedundant generated maps and exact replacements: [{stem}.material.json]({stem}.material.json).\n"
        if note.strip() not in text:
            text += note
        readme.write_text(text, encoding="utf-8")
report = ROOT / "tmp/pbr-inventory/cleanup-report.json"
report.parent.mkdir(parents=True, exist_ok=True)
report.write_text(json.dumps(removed, indent=2) + "\n", encoding="utf-8")
print(f"Removed {len(removed)} redundant generated images ({sum(item['bytes'] for item in removed)} bytes).")
