"""Pixel and ownership-metadata checks; no image viewer is used."""
import importlib.util
import json
import random
import shutil
import uuid
import unittest
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("asset_packer", ROOT / "scripts/assets/pack.py")
packer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packer)


class PackingTests(unittest.TestCase):
    def test_deterministic_nonoverlapping_bounded_pages(self):
        rng = random.Random(424242)
        sprites = [{"id": f"sprite-{i}", "size": [rng.randint(1, 90), rng.randint(1, 90)]} for i in range(150)]
        result = packer.layout(sprites, 128, 2)
        self.assertEqual(result, packer.layout(list(reversed(sprites)), 128, 2))
        rectangles = []
        for item in result.values():
            x, y, w, h = item["frame"]
            padded = (x - 2, y - 2, w + 4, h + 4)
            self.assertTrue(packer.inside(padded, (0, 0, 128, 128)))
            for page, (ox, oy, ow, oh) in rectangles:
                if page == item["page"]:
                    self.assertTrue(x - 2 >= ox + ow or x + w + 2 <= ox or y - 2 >= oy + oh or y + h + 2 <= oy)
            rectangles.append((item["page"], padded))

    def test_invalid_layout(self):
        for sprites in [[{"id": "large", "size": [128, 1]}], [{"id": "zero", "size": [0, 2]}],
                        [{"id": "same", "size": [1, 1]}, {"id": "same", "size": [1, 1]}]]:
            with self.assertRaises(ValueError):
                packer.layout(sprites, 128)

    def test_co_use_layout_reduces_loaded_pixels_without_duplicate_entries(self):
        sprites = [{"id": f"{family}.{cell}", "size": [30, 30]}
                   for family in ("shared", "a", "b") for cell in range(2)]
        groups = {"a": [s["id"] for s in sprites if not s["id"].startswith("b.")],
                  "b": [s["id"] for s in sprites if not s["id"].startswith("a.")]}
        positions = packer.dependency_layout(sprites, groups, list(groups), 128, 2)
        self.assertEqual(set(positions), {s["id"] for s in sprites})
        self.assertEqual(positions, packer.dependency_layout(list(reversed(sprites)), groups, list(reversed(groups)), 128, 2))
        for scene, ids in groups.items():
            pages = {positions[key]["page"] for key in ids}
            other = "b." if scene == "a" else "a."
            self.assertFalse(any(positions[key]["page"] in pages for key in positions if key.startswith(other)))

    def test_fractional_frame_keeps_exact_logical_sampling_coordinates(self):
        folder = ROOT / "tmp" / f"asset-packing-test-{uuid.uuid4()}"
        folder.mkdir(parents=True)
        self.addCleanup(lambda: shutil.rmtree(folder))
        Image.new("RGBA", (10, 10), (10, 80, 90, 255)).save(folder / "colour.png")
        relative = folder.relative_to(ROOT).as_posix()
        result = packer.compile_pack({"version": 1, "sprites": [{"id": "half-pixel", "frame": [2.5, 1.5, 4.5, 5.5],
            "maps": {"colour": f"{relative}/colour.png"}}]}, f"{relative}/packed", 32)
        value = result["sprites"]["half-pixel"]
        self.assertEqual(value["logicalSize"], [4.5, 5.5])
        self.assertEqual(value["trim"], [0, 0])
        self.assertEqual(value["frame"], [2.5, 2.5, 4.5, 5.5])
        self.assertEqual(value["storageFrame"], [2, 2, 5, 6])

    def test_pixels_trim_pivots_dependencies_and_black_emission(self):
        (ROOT / "tmp").mkdir(exist_ok=True)
        folder = ROOT / "tmp" / f"asset-packing-test-{uuid.uuid4()}"
        folder.mkdir()
        self.addCleanup(lambda: shutil.rmtree(folder))
        image = Image.new("RGBA", (20, 20))
        image.paste((50, 80, 120, 255), (7, 6, 12, 14))
        image.putpixel((6, 6), (10, 20, 30, 1))  # Preserve even faint fringe.
        image.save(folder / "colour.png")
        Image.new("RGBA", image.size, (0, 0, 0, 255)).save(folder / "emissive.png")
        Image.new("RGBA", image.size, (31, 92, 255, 255)).save(folder / "surface.png")
        relative = folder.relative_to(ROOT).as_posix()
        sprite = {"id": "shared.rock", "frame": [0, 0, 20, 20], "pivot": [10, 18],
                  "maps": {kind: f"{relative}/{kind}.png" for kind in ["colour", "emissive", "surface"]}}
        inputs = {"version": 1, "sprites": [sprite], "dependencies": {"scene-a": [sprite["id"]], "scene-b": [sprite["id"]]}}
        result = packer.compile_pack(inputs, f"{relative}/packed", 64)
        value = result["sprites"][sprite["id"]]
        self.assertEqual(value["logicalSize"], [20, 20])
        self.assertEqual(value["pivot"], [10, 18])
        self.assertEqual(value["trim"], [4, 4])
        self.assertNotIn("emissive", result["pages"][0]["maps"])
        self.assertEqual(len(result["sprites"]), 1)
        x, y, w, h = value["frame"]
        packed = Image.open(folder / "packed/page-0-colour.png")
        restored = Image.new("RGBA", (20, 20))
        restored.paste(packed.crop((x, y, x + w, y + h)), tuple(value["trim"]))
        self.assertEqual(restored.tobytes(), image.tobytes())
        first = (folder / "packed/manifest.json").read_bytes()
        packer.compile_pack(inputs, f"{relative}/packed", 64)
        self.assertEqual(first, (folder / "packed/manifest.json").read_bytes())
        inputs["dependencies"]["broken"] = ["missing"]
        with self.assertRaises(ValueError):
            packer.compile_pack(inputs, f"{relative}/packed", 64)


if __name__ == "__main__":
    unittest.main()
