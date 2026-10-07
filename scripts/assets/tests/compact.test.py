import sys
sys.dont_write_bytecode = True
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from PIL import Image

spec = importlib.util.spec_from_file_location('compact', Path(__file__).resolve().parents[1]/'compact.py')
TEST_TMP = Path(__file__).resolve().parents[3]/'tmp/asset-compaction/tests'
TEST_TMP.mkdir(parents=True, exist_ok=True)
compact = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compact)


class CompactionTests(unittest.TestCase):
    def test_hidden_colour_does_not_emit(self):
        image = Image.new('RGBA', (2,1))
        image.putdata([(255,0,0,0), (0,0,0,255)])
        self.assertTrue(compact.zero_emission(image))
        image.putpixel((1,0), (1,0,0,1))
        self.assertFalse(compact.zero_emission(image))

    def test_channels_are_exact(self):
        surface = Image.new('RGBA', (2,2), (23,45,67,255))
        maps = [Image.new('RGBA',(2,2),(v,v,v,255)) for v in [23,45,67]]
        self.assertTrue(compact.scalar_matches(surface,maps))
        maps[1].putpixel((1,1), (46,46,46,255))
        self.assertFalse(compact.scalar_matches(surface,maps))

    def test_data_including_transparent_rgb_is_exact(self):
        image = Image.new('RGBA',(2,2))
        image.putdata([(17,32,255,0),(128,127,253,255),(12,234,33,127),(42,51,67,255)])
        encoded, metadata = compact.encode(image, True)
        self.assertTrue(metadata['lossless'])
        from io import BytesIO
        self.assertEqual(Image.open(BytesIO(encoded)).convert('RGBA').tobytes(), image.tobytes())

    def test_apply_preserves_authoring_and_is_idempotent(self):
        with tempfile.TemporaryDirectory(dir=TEST_TMP) as temp:
            root = Path(temp)
            pack = root/'src/pbr/sample'
            pack.mkdir(parents=True)
            source = root/'src/sample.png'
            Image.new('RGBA',(3,3),(40,80,120,255)).save(source)
            original = source.read_bytes()
            for kind, colour in {'diffuse':(40,80,120,255),'normal':(128,128,255,255),
                                 'surface':(23,45,67,255),'roughness':(23,23,23,255),
                                 'metallic':(45,45,45,255),'ao':(67,67,67,255),'emissive':(0,0,0,255)}.items():
                Image.new('RGBA',(3,3),colour).save(pack/f'sample_{kind}.png')
            catalog = root/'scripts/pbr/asset-packs.json'
            catalog.parent.mkdir(parents=True)
            catalog.write_text(json.dumps({'assets':[{'source':'src/sample.png','output':'src/pbr/sample'}]}))
            compact.run(root,True)
            self.assertEqual(source.read_bytes(),original)
            self.assertTrue(source.with_suffix('.webp').exists())
            self.assertEqual(sorted(p.name for p in pack.iterdir()), ['sample_diffuse.webp','sample_normal.webp','sample_surface.webp'])
            manifest = root/'scripts/assets/compaction-manifest.json'
            first, timestamp = manifest.read_bytes(), manifest.stat().st_mtime_ns
            compact.run(root,True)
            self.assertEqual(manifest.read_bytes(),first)
            self.assertEqual(manifest.stat().st_mtime_ns,timestamp)

    def test_mismatching_family_remains_untouched(self):
        with tempfile.TemporaryDirectory(dir=TEST_TMP) as temp:
            root=Path(temp)
            pack=root/'src/pbr/sample'
            pack.mkdir(parents=True)
            for kind in ['diffuse','normal','surface','roughness','metallic','ao','emissive']:
                Image.new('RGBA',(2,2),(0 if kind=='surface' else 1,0,0,255)).save(pack/f'sample_{kind}.png')
            catalog=root/'scripts/pbr/asset-packs.json'
            catalog.parent.mkdir(parents=True)
            catalog.write_text(json.dumps({'assets':[{'source':'src/sample.png','output':'src/pbr/sample'}]}))
            before={p.name:p.read_bytes() for p in pack.iterdir()}
            compact.run(root,True)
            self.assertEqual({p.name:p.read_bytes() for p in pack.iterdir()},before)


if __name__=='__main__': unittest.main()
