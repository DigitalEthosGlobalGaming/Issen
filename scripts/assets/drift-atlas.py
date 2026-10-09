"""Right-size drift artwork without modifying retained full-resolution sources.

Requires Pillow >=12. Outputs a trial under tmp by default; pass --output to
install reviewed assets. Each 128px cell has a 4px transparent gutter and 120px
content; frame rectangles address content only. RGBA resampling uses associated
alpha, then returns to straight alpha for WebP/browser decoding.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

FAMILIES = ('leaves', 'petals', 'debris', 'fire')


def resize_frame(image, bounds, size):
    return image.convert('RGBA').crop(bounds).convert('RGBa').resize(
        (size, size), Image.Resampling.LANCZOS).convert('RGBA')


def generate(root, output, cell=128, gutter=4, review_output=None):
    if cell not in (128, 192) or not 1 <= gutter < cell // 4:
        raise ValueError('Use 128 or 192px cells and a small positive gutter')
    output.mkdir(parents=True, exist_ok=True)
    assets = root / 'src/rendering/environment/assets'
    # Removed runtime siblings remain represented by their audited compaction record.
    compaction = root / 'scripts/assets/compaction-manifest.json'
    historical = json.loads(compaction.read_text(encoding='utf8'))['files'] if compaction.exists() else []
    colour = Image.new('RGBA', (cell * 8, cell * 4))
    emission = Image.new('RGBA', colour.size)
    content = cell - gutter * 2
    sources, frames = [], {}
    before_bytes = 0
    before_decoded = 0
    for row, family in enumerate(FAMILIES):
        name = f'drift-{family}-atlas'
        source = assets / f'{name}.png'
        image = Image.open(source).convert('RGBA')
        sources.append({'path': source.relative_to(root).as_posix(),
                        'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
        runtime = assets / f'{name}.webp'
        if not runtime.exists():
            record = next((item for item in historical if item.get('newPath') == runtime.relative_to(root).as_posix()), None)
            if record:
                before_bytes += record['sizeAfter']
                before_decoded += image.width * image.height * 4
        # Existing drift renders base colour + normal + surface + optional emission.
        planes = [runtime, *[assets / 'pbr' / name / f'{name}_{kind}.webp'
                            for kind in ('normal', 'surface', 'emissive')]]
        for plane in planes:
            if plane.exists():
                before_bytes += plane.stat().st_size
                with Image.open(plane) as decoded:
                    before_decoded += decoded.width * decoded.height * 4
        emissive_path = assets / 'pbr' / name / f'{name}_emissive.webp'
        emissive = Image.open(emissive_path).convert('RGBA') if emissive_path.exists() else None
        if emissive is not None:
            sources.append({'path': emissive_path.relative_to(root).as_posix(),
                            'sha256': hashlib.sha256(emissive_path.read_bytes()).hexdigest()})
        frames[family] = []
        for index in range(8):
            def bounds(im):
                x, y = index % 4, index // 4
                return tuple(int(v + .5) for v in
                             (x * im.width / 4, y * im.height / 2,
                              (x + 1) * im.width / 4, (y + 1) * im.height / 2))
            x, y = index * cell + gutter, row * cell + gutter
            colour.paste(resize_frame(image, bounds(image), content), (x, y))
            if emissive is not None:
                emission.paste(resize_frame(emissive, bounds(emissive), content), (x, y))
            frames[family].append([x, y, content, content])
    colour.save(output / 'drift-colour.webp', lossless=False, quality=95,
                method=6, exact=True, alpha_quality=100)
    emission.save(output / 'drift-emissive.webp', lossless=True,
                  quality=100, method=6, exact=True)
    # Lossless review references make encoding artefacts inspectable independently.
    review = review_output or output
    review.mkdir(parents=True, exist_ok=True)
    colour.save(review / 'drift-colour-reference.png')
    emission.save(review / 'drift-emissive-reference.png')
    decoded_bytes = colour.width * colour.height * 4 * 2
    report = {'cell': cell, 'gutter': gutter, 'content': content,
              'dimensions': list(colour.size), 'frames': frames, 'sources': sources,
              'before': {'fileBytes': before_bytes, 'decodedBytes': before_decoded},
              'after': {'fileBytes': sum((output / p).stat().st_size for p in
                                        ('drift-colour.webp', 'drift-emissive.webp')),
                        'decodedBytes': decoded_bytes,
                        'gpuBytesWithMipmapsEstimate': round(decoded_bytes * 4 / 3)},
              'decodedReduction': 1 - decoded_bytes / before_decoded}
    (output / 'drift-atlas.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--output', type=Path, default=Path('tmp/drift-atlas'))
    parser.add_argument('--cell', type=int, default=128)
    parser.add_argument('--review-output', type=Path, default=Path('tmp/drift-atlas'))
    parser.add_argument('--gutter', type=int, default=4)
    args = parser.parse_args()
    result = generate(args.root.resolve(), args.output, args.cell, args.gutter, args.review_output)
    print(json.dumps({key: result[key] for key in
                      ('dimensions', 'before', 'after', 'decodedReduction')}, indent=2))
