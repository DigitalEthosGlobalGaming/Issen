"""Focused alpha-resampling and frame-layout checks for drift-atlas.py."""
import importlib.util
import sys
from pathlib import Path
from uuid import uuid4
import unittest
from PIL import Image

sys.dont_write_bytecode = True

spec = importlib.util.spec_from_file_location(
    'drift_atlas', Path(__file__).resolve().parents[1] / 'drift-atlas.py')
drift = importlib.util.module_from_spec(spec)
spec.loader.exec_module(drift)


class DriftAtlasTests(unittest.TestCase):
    def test_transparent_hidden_colour_does_not_bleed(self):
        image = Image.new('RGBA', (32, 32), (0, 0, 255, 0))
        for y in range(8, 24):
            for x in range(8, 24):
                image.putpixel((x, y), (255, 0, 0, 255))
        resized = drift.resize_frame(image, (0, 0, 32, 32), 8)
        for r, g, b, a in resized.get_flattened_data():
            if a:
                self.assertEqual((r, g, b), (255, 0, 0))

    def test_odd_source_boundaries_and_gutters(self):
        scratch = Path(__file__).resolve().parents[3] / 'tmp' / 'drift-generator-tests'
        scratch.mkdir(parents=True, exist_ok=True)
        # Retain generated verification artifacts under ignored tmp.
        folder = scratch / str(uuid4())
        folder.mkdir()
        with self.subTest(artifact=folder.name):
            root = folder
            assets = root / 'src/rendering/environment/assets'
            assets.mkdir(parents=True)
            for family in drift.FAMILIES:
                image = Image.new('RGBA', (1774, 887), (240, 120, 60, 255))
                image.save(assets / f'drift-{family}-atlas.png')
                image.save(assets / f'drift-{family}-atlas.webp', lossless=True)
            report = drift.generate(root, root / 'out')
            self.assertEqual(report['dimensions'], [1024, 512])
            self.assertEqual(report['after']['decodedBytes'], 4194304)
            self.assertEqual(len(report['frames']), 4)
            with Image.open(root / 'out/drift-colour-reference.png') as atlas:
                for row, family in enumerate(drift.FAMILIES):
                    for col, frame in enumerate(report['frames'][family]):
                        self.assertEqual(frame, [col * 128 + 4, row * 128 + 4, 120, 120])
                        self.assertEqual(atlas.getpixel((col * 128, row * 128))[3], 0)
                        self.assertEqual(atlas.getpixel((frame[0], frame[1]))[3], 255)


if __name__ == '__main__':
    unittest.main()
