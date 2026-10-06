import importlib.util
from io import BytesIO
import json
from pathlib import Path
import shutil
import unittest
import uuid
import zipfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location("map_cleanup", ROOT / "scripts/pbr/map_cleanup.py")
cleanup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cleanup)


class CleanupTests(unittest.TestCase):
    def test_zero_is_preserved_as_data_not_interpreted_as_disabled(self):
        maps = {"diffuse": Image.new("RGBA", (3, 2), (100, 100, 100, 255)),
                "emissive": Image.new("RGBA", (3, 2), (0, 0, 0, 255)),
                "roughness": Image.new("RGBA", (3, 2), (0, 0, 0, 255)),
                "metallic": Image.new("RGBA", (3, 2), (0, 0, 0, 255)),
                "ao": Image.new("RGBA", (3, 2), (255, 255, 255, 255))}
        self.assertEqual(cleanup.redundant_maps(maps), {"emissive": [0, 0, 0], "roughness": 0, "metallic": 0, "ao": 255})
        for kind in cleanup.SCALARS:
            self.assertEqual(cleanup.reconstructed_map(kind, cleanup.redundant_maps(maps)[kind], (3, 2)).tobytes(), maps[kind].tobytes())
        maps["ao"].putpixel((1, 1), (254, 254, 254, 255))
        maps["emissive"].putpixel((0, 0), (0, 1, 0, 255))
        self.assertNotIn("ao", cleanup.redundant_maps(maps))
        self.assertNotIn("emissive", cleanup.redundant_maps(maps))

    def test_hidden_emission_and_transparent_scalar_sampling(self):
        colour = Image.new("RGBA", (2, 1), (10, 10, 10, 255))
        colour.putpixel((1, 0), (0, 0, 0, 0))
        emission = Image.new("RGBA", (2, 1), (0, 0, 0, 255))
        emission.putpixel((1, 0), (255, 255, 255, 255))
        ao = Image.new("RGBA", (2, 1), (255, 255, 255, 255))
        ao.putpixel((1, 0), (255, 255, 255, 0))
        self.assertEqual(cleanup.redundant_maps({"diffuse": colour, "emissive": emission, "ao": ao}), {"emissive": [0, 0, 0]})

    def test_archive_cleanup_is_repeatable_and_keeps_unrelated_members(self):
        folder = ROOT / "tmp" / f"map-cleanup-test-{uuid.uuid4()}"
        folder.mkdir(parents=True)
        self.addCleanup(lambda: shutil.rmtree(folder))
        archive = folder / "test.zip"
        with zipfile.ZipFile(archive, "w") as result:
            for kind, colour in {"diffuse": (10, 10, 10, 255), "emissive": (0, 0, 0, 255),
                                 "metallic": (0, 0, 0, 255), "normal": (128, 128, 255, 255),
                                 "roughness": (80, 80, 80, 255), "ao": (160, 160, 160, 255)}.items():
                data = BytesIO()
                image = Image.new("RGBA", (2, 2), colour)
                if kind in ("roughness", "ao"):
                    image.putpixel((0, 0), (0, 0, 0, 255))
                image.save(data, format="PNG")
                result.writestr(f"sprite_{kind}.png", data.getvalue())
            result.writestr("settings.json", '{"keep": true}')
        Path(str(archive) + ".json").write_text('{"jobHash": "keep"}', encoding="utf-8")
        self.assertEqual(len(cleanup.clean_archive(archive)), 2)
        before = archive.read_bytes()
        self.assertEqual(cleanup.clean_archive(archive), [])
        self.assertEqual(before, archive.read_bytes())
        metadata = json.loads(Path(str(archive) + ".json").read_text(encoding="utf-8"))
        self.assertEqual(metadata["omittedMaps"], {"emissive": [0, 0, 0], "metallic": 0})
        with zipfile.ZipFile(archive) as result:
            self.assertEqual(set(result.namelist()), {"sprite_diffuse.png", "sprite_normal.png", "sprite_roughness.png", "sprite_ao.png", "settings.json"})
        # Reintroduced varying pixels must override old omission metadata.
        data = BytesIO()
        image = Image.new("RGBA", (2, 2), (0, 0, 0, 255))
        image.putpixel((1, 1), (0, 2, 0, 255))
        image.save(data, format="PNG")
        with zipfile.ZipFile(archive, "a") as result:
            result.writestr("sprite_emissive.png", data.getvalue())
        self.assertEqual(cleanup.clean_archive(archive), [])
        metadata = json.loads(Path(str(archive) + ".json").read_text(encoding="utf-8"))
        self.assertNotIn("emissive", metadata["omittedMaps"])

    def test_missing_material_metadata_fails_without_modifying_archive(self):
        folder = ROOT / "tmp" / f"map-cleanup-test-{uuid.uuid4()}"
        folder.mkdir(parents=True)
        self.addCleanup(lambda: shutil.rmtree(folder))
        archive = folder / "broken.zip"
        data = BytesIO()
        Image.new("RGBA", (2, 2), (50, 50, 50, 255)).save(data, format="PNG")
        with zipfile.ZipFile(archive, "w") as result:
            result.writestr("sprite_diffuse.png", data.getvalue())
        Path(str(archive) + ".json").write_text('{}', encoding="utf-8")
        before = archive.read_bytes()
        with self.assertRaisesRegex(ValueError, "without omission metadata"):
            cleanup.clean_archive(archive)
        self.assertEqual(archive.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
