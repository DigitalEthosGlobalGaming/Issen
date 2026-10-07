"""Layout-preserving runtime compaction. Requires Python 3 and Pillow >= 12.

Authoring colour PNGs remain in place; generated map PNGs are backed up under
ignored tmp before removal. No packing, resizing, or source-art deletion.
"""
from concurrent.futures import ThreadPoolExecutor
import argparse
import hashlib
import json
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageChops
from PIL.PngImagePlugin import PngInfo
import struct
import zlib


def digest(data):
    return hashlib.sha256(data).hexdigest()


def zero_emission(image):
    rgba = image.convert('RGBA')
    visible = rgba.getchannel('A').point(lambda value: 255 if value else 0)
    return all(ImageChops.multiply(rgba.getchannel(channel), visible).getbbox() is None for channel in 'RGB')


def scalar_matches(surface, maps):
    return all(surface.size == image.size and ImageChops.difference(
        surface.convert('RGBA').getchannel(channel), image.convert('RGBA').getchannel('R')
    ).getbbox() is None for channel, image in zip('RGB', maps))


def errors(original, decoded, exact):
    original, decoded = original.convert('RGBA'), decoded.convert('RGBA')
    if original.size != decoded.size:
        return None
    delta = ImageChops.difference(original, decoded)
    if delta.getchannel('A').getbbox() is not None:
        return None
    if exact:
        return ([0, 0, 0], [0, 0, 0]) if all(delta.getchannel(c).getbbox() is None for c in 'RGB') else None
    visible = original.getchannel('A').point(lambda value: 255 if value else 0)
    count = visible.histogram()[255]
    means, maxima = [], []
    for channel in 'RGB':
        hist = ImageChops.multiply(delta.getchannel(channel), visible).histogram()
        means.append(sum(i*n for i, n in enumerate(hist))/max(1, count))
        maxima.append(max((i for i, n in enumerate(hist) if n), default=0))
    return means, maxima


def encode(image, data):
    for quality in ([100] if data else [90, 95, 98, 100, None]):
        lossless = data or quality is None
        buffer = BytesIO()
        image.save(buffer, 'WEBP', lossless=lossless, quality=quality or 100,
                   method=6, exact=True, alpha_quality=100)
        encoded = buffer.getvalue()
        metrics = errors(image, Image.open(BytesIO(encoded)), data or lossless)
        if metrics and max(metrics[0]) <= 0.5 and max(metrics[1]) <= 8:
            return encoded, {'format': 'webp', 'lossless': lossless, 'quality': quality,
                             'method': 6, 'meanError': metrics[0], 'maxError': metrics[1]}
    raise ValueError('No WebP encoding preserves the required decoded values')


def optimized_png(original, image):
    # Preserve critical chunks and colour interpretation, remove metadata only.
    chunks, offset = [], 8
    while offset < len(original):
        length = struct.unpack('>I', original[offset:offset+4])[0]
        kind = original[offset+4:offset+8]
        payload = original[offset+8:offset+8+length]
        chunks.append((kind, payload))
        offset += length + 12
    keep = {b'IHDR', b'PLTE', b'tRNS', b'IDAT', b'IEND', b'iCCP', b'sRGB', b'gAMA', b'cHRM', b'sBIT'}
    if any(kind in {b'acTL', b'fcTL', b'fdAT'} for kind, _ in chunks):
        raise ValueError('Animated PNG compaction is unsupported')
    def chunk(kind, payload):
        return struct.pack('>I', len(payload))+kind+payload+struct.pack('>I', zlib.crc32(kind+payload))
    compressed = zlib.compress(zlib.decompress(b''.join(payload for kind, payload in chunks if kind == b'IDAT')), 9)
    parts, emitted = [], False
    for kind, payload in chunks:
        if kind not in keep: continue
        if kind == b'IDAT':
            if emitted: continue
            payload, emitted = compressed, True
        parts.append(chunk(kind, payload))
    candidates = [b'\x89PNG\r\n\x1a\n'+b''.join(parts)]
    metadata = PngInfo()
    for kind, payload in chunks:
        if kind in {b'iCCP', b'sRGB', b'gAMA', b'cHRM', b'sBIT'}:
            metadata.add(kind, payload)
    buffer = BytesIO()
    options = {'pnginfo': metadata, 'optimize': True, 'compress_level': 9}
    if 'transparency' in image.info: options['transparency'] = image.info['transparency']
    image.save(buffer, 'PNG', **options)
    candidates.append(buffer.getvalue())
    valid = [candidate for candidate in candidates if errors(image, Image.open(BytesIO(candidate)), True)]
    if not valid: raise ValueError('PNG recompression changed decoded values')
    return min(valid, key=len)


def reusable(record):
    return record.get('encoding', {}).get('format') == 'png' or record['sizeAfter'] < record['sizeBefore']


def encode_file(source, data):
    original = source.read_bytes()
    with Image.open(BytesIO(original)) as image:
        encoded, encoding = encode(image, data)
        if len(encoded) >= len(original):
            png = optimized_png(original, image)
            if len(png) <= len(encoded):
                encoded = png
                encoding = {'format': 'png', 'lossless': True, 'meanError': [0,0,0], 'maxError': [0,0,0]}
        return encoded, encoding, list(image.size), digest(original)


def pending_encodings(root, files, records, generated, removals, untouched):
    for source in files:
        source.resolve().relative_to(root.resolve())
        if source in removals or source in untouched:
            continue
        old = records.get(source.relative_to(root).as_posix())
        if old and old['originalHash'] == digest(source.read_bytes()) and old.get('newPath') and reusable(old):
            target = root/old['newPath']
            target.resolve().relative_to(root.resolve())
            if target.exists() and digest(target.read_bytes()) == old['newHash']:
                continue
        yield source, source in generated and not source.stem.endswith('_diffuse')


def run(root, apply, retain_generated_png=False, workers=4):
    if not isinstance(workers, int) or not 1 <= workers <= 8:
        raise ValueError("Encoding workers must be between 1 and 8")
    catalog_path = root/'scripts/pbr/asset-packs.json'
    catalog = json.loads(catalog_path.read_text()) if catalog_path.exists() else {'assets': []}
    jobs = catalog['assets'] + catalog.get('installed', [])
    manifest_path = root/'scripts/assets/compaction-manifest.json'
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {'files': []}
    records = {record['originalPath']: record for record in previous['files']}
    generated, removals, untouched = set(), {}, set()
    for job in jobs:
        directory = root/job['output']
        directory.resolve().relative_to(root.resolve())
        stem = Path(job['source']).stem
        files = {kind: directory/f'{stem}_{kind}.png' for kind in ['diffuse', 'normal', 'surface', 'emissive', 'roughness', 'metallic', 'ao']}
        generated.update(files.values())
        scalars = [files[kind] for kind in ['roughness', 'metallic', 'ao']]
        if all(p.exists() for p in scalars):
            with Image.open(files['surface']) as surface:
                maps = [Image.open(p) for p in scalars]
                try:
                    matches = scalar_matches(surface, maps)
                finally:
                    for image in maps: image.close()
            if not matches:
                untouched.update(files.values())
                print(f'KEEP mismatching family: {job["output"]}', flush=True)
                continue
            removals.update({p: 'redundant-scalar' for p in scalars})
        if files['emissive'].exists():
            with Image.open(files['emissive']) as image:
                if zero_emission(image): removals[files['emissive']] = 'zero-emission'
    files = sorted({p for folder in ['src', 'public'] for p in (root/folder).rglob('*.png') if not p.name.endswith('.compact.png')})
    changed = 0
    # Workers only encode and validate independent images. The parent commits
    # outputs and manifest entries in deterministic filename order. Prefetch is
    # bounded to workers so decoded images and completed buffers stay bounded.
    work = iter(pending_encodings(root, files, records, generated, removals, untouched))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        active = {}
        def schedule():
            while len(active) < workers:
                task = next(work, None)
                if task is None:
                    break
                source, data = task
                active[source] = pool.submit(encode_file, source, data)
        schedule()
        for source in files:
            if source in untouched: continue
            rel = source.relative_to(root).as_posix()
            original = source.read_bytes()
            original_hash = digest(original)
            old = records.get(rel)
            if old and old['originalHash'] == original_hash:
                if retain_generated_png and source in removals and old['action'] == removals[source]:
                    continue
                target = root/old['newPath'] if old.get('newPath') else None
                if target and reusable(old) and target.exists() and digest(target.read_bytes()) == old['newHash']:
                    if source in generated and apply and not retain_generated_png:
                        source.unlink()
                        changed += 1
                    continue
            backup = root/'tmp/asset-compaction/originals'/rel
            if source in removals:
                record = {'originalPath':rel, 'originalHash':original_hash, 'sizeBefore':len(original),
                          'sizeAfter':0, 'action':removals[source], 'newPath':None, 'newHash':None, 'encoding':None}
                encoded = None
            else:
                future = active.pop(source, None)
                encoded, encoding, dimensions, encoded_hash = (future.result() if future else encode_file(source, source in generated and not source.stem.endswith('_diffuse')))
                if encoded_hash != original_hash:
                    raise ValueError(f'Source changed during encoding: {rel}')
                schedule()
                target = source.with_suffix('.webp' if encoding['format'] == 'webp' else '.compact.png')
                if target.exists() and digest(target.read_bytes()) != digest(encoded) and (not old or digest(target.read_bytes()) != old.get('newHash')):
                    raise ValueError(f'Refusing to overwrite an unrelated compact output: {rel}')
                record = {'originalPath':rel, 'originalHash':original_hash, 'sizeBefore':len(original),
                          'sizeAfter':len(encoded), 'action':'replace-generated' if source in generated else 'retain-authoring',
                          'newPath':target.relative_to(root).as_posix(), 'newHash':digest(encoded),
                          'dimensions':dimensions, 'encoding':encoding}
            # Preserve the one-off restore input when a later material export
            # changes. Its new input gets an immutable hash-addressed backup.
            if backup.exists() and digest(backup.read_bytes()) != original_hash:
                backup = root/'tmp/asset-compaction/regenerated-originals'/original_hash/rel
            record['backupPath'] = backup.relative_to(root).as_posix()
            if apply:
                backup.parent.mkdir(parents=True, exist_ok=True)
                if backup.exists() and digest(backup.read_bytes()) != original_hash:
                    raise ValueError(f'Hash-addressed backup differs: {rel}')
                if not backup.exists(): backup.write_bytes(original)
                if old and old.get('newPath') and old['newPath'] != record['newPath']:
                    superseded = root/old['newPath']
                    superseded.resolve().relative_to(root.resolve())
                    if superseded.exists():
                        if digest(superseded.read_bytes()) != old['newHash']:
                            raise ValueError(f'Superseded output changed: {rel}')
                        superseded.unlink()
                if encoded is not None: target.write_bytes(encoded)
                if source in generated and not retain_generated_png: source.unlink()
            records[rel] = record
            if apply:
                manifest_path.parent.mkdir(parents=True, exist_ok=True)
                manifest_path.write_text(json.dumps({'version':1, 'files':sorted(records.values(), key=lambda r:r['originalPath'])}, indent=2)+'\n')
            changed += 1
            print(f'{record["action"]}: {rel} ({len(original)} -> {record["sizeAfter"]})', flush=True)
    manifest = {'version':1, 'files': sorted(records.values(), key=lambda r:r['originalPath'])}
    if apply and changed:
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(json.dumps(manifest, indent=2)+'\n')
    print(f'{changed} changes; apply={apply}', flush=True)
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--retain-generated-png', action='store_true', help='Stage conversions before URL migration; final apply removes generated PNGs')
    args = parser.parse_args()
    run(args.root.resolve(), args.apply, args.retain_generated_png, args.workers)
