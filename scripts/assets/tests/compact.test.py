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

    def test_png_exception_preserves_pixels_metadata_and_idempotence(self):
        from PIL.PngImagePlugin import PngInfo
        from io import BytesIO
        with tempfile.TemporaryDirectory(dir=TEST_TMP) as temp:
            root = Path(temp)
            source = root/'src/tiny.png'
            source.parent.mkdir()
            image = Image.new('RGBA', (1,1), (20,60,120,127))
            metadata = PngInfo()
            metadata.add_text('provenance', 'temporary test metadata')
            metadata.add(b'gAMA', bytes.fromhex('0000b18f'))
            image.save(source, pnginfo=metadata)
            original = source.read_bytes()
            optimized = compact.optimized_png(original, Image.open(BytesIO(original)))
            self.assertEqual(Image.open(BytesIO(optimized)).convert('RGBA').tobytes(), image.tobytes())
            self.assertNotIn(b'provenance', optimized)
            self.assertIn(b'gAMA', optimized)
            # Force a valid but larger WebP to exercise the size-fallback path.
            from unittest.mock import patch
            real_encode = compact.encode
            def padded_encode(image, data):
                encoded, settings = real_encode(image, data)
                return encoded + bytes(1000), settings
            with patch.object(compact, 'encode', padded_encode):
                manifest = compact.run(root, True, retain_generated_png=True)
                record = manifest['files'][0]
                self.assertEqual(record['encoding']['format'], 'png')
                self.assertTrue(record['newPath'].endswith('.compact.png'))
                self.assertEqual(source.read_bytes(), original)
                self.assertLess(record['sizeAfter'], record['sizeBefore'])
                path = root/'scripts/assets/compaction-manifest.json'
                first = path.read_bytes()
                compact.run(root, True, retain_generated_png=True)
                self.assertEqual(path.read_bytes(), first)

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
            compact.run(root,True,retain_generated_png=True,workers=4)
            self.assertEqual(len(list(pack.glob("*.png"))),7)
            staged = (root/"scripts/assets/compaction-manifest.json").read_bytes()
            compact.run(root,True,retain_generated_png=True,workers=2)
            self.assertEqual((root/"scripts/assets/compaction-manifest.json").read_bytes(),staged)
            compact.run(root,True,workers=4)
            self.assertEqual(source.read_bytes(),original)
            self.assertTrue(source.with_suffix('.webp').exists())
            self.assertEqual(sorted(p.name for p in pack.iterdir()), ['sample_diffuse.webp','sample_normal.webp','sample_surface.webp'])
            manifest = root/'scripts/assets/compaction-manifest.json'
            first, timestamp = manifest.read_bytes(), manifest.stat().st_mtime_ns
            compact.run(root,True)
            self.assertEqual(manifest.read_bytes(),first)
            self.assertEqual(manifest.stat().st_mtime_ns,timestamp)
            original_backup = root/'tmp/asset-compaction/originals/src/pbr/sample/sample_emissive.png'
            preserved = original_backup.read_bytes()
            regenerated = pack/'sample_emissive.png'
            Image.new('RGBA',(3,3),(20,80,120,255)).save(regenerated)
            new_input = regenerated.read_bytes()
            compact.run(root,True,workers=2)
            latest = json.loads(manifest.read_text())
            emission = next(record for record in latest['files'] if record['originalPath'].endswith('sample_emissive.png'))
            self.assertEqual(emission['action'],'replace-generated')
            self.assertEqual(original_backup.read_bytes(),preserved)
            self.assertEqual((root/emission['backupPath']).read_bytes(),new_input)
            self.assertTrue((pack/'sample_emissive.webp').exists())
            self.assertFalse(regenerated.exists())
            final = manifest.read_bytes()
            compact.run(root,True,workers=4)
            self.assertEqual(manifest.read_bytes(),final)
            # A later zero export must remove a prior emitting compact sibling.
            Image.new('RGBA',(3,3),(0,0,0,255)).save(regenerated)
            compact.run(root,True,workers=2)
            latest = json.loads(manifest.read_text())
            emission = next(record for record in latest['files'] if record['originalPath'].endswith('sample_emissive.png'))
            self.assertEqual(emission['action'],'zero-emission')
            self.assertIsNone(emission['newPath'])
            self.assertFalse((pack/'sample_emissive.webp').exists())
            self.assertFalse(regenerated.exists())
            final = manifest.read_bytes()
            compact.run(root,True)
            self.assertEqual(manifest.read_bytes(),final)


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
