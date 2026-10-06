import { parseArgs } from 'node:util';
import { readFile, readdir, mkdir, stat, rename, rm, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { loadPreset, listPresets, validatePreset } from './preset.mjs';
import { createPbrForge } from './pbr-forge/index.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const runFile = promisify(execFile);
export async function cleanupArchive(archive) {
  await runFile(
    process.env.PBR_PYTHON ?? 'python',
    [fileURLToPath(new URL('./map_cleanup.py', import.meta.url)), archive],
    { windowsHide: true },
  );
}

export const HELP = `PBR Forge batch CLI

node scripts/pbr/cli.mjs --input IMAGE_OR_FOLDER --output FOLDER --preset cloth

  --preset NAME_OR_FILE  Built-in name or path to a .pbr.json file (default: default)
  --mode MODE            Override preset: auto, sprite, texture
  --engine ENGINE        Override preset: opengl, directx
  --force                Regenerate matching existing exports
  --headed               Show the browser
  --channel NAME         Installed browser channel (default: msedge)
  --list-presets         List built-in JSON presets
  --help                Show this help

Folders are processed non-recursively: PNG, JPG, JPEG and WebP.
Each image produces a ZIP plus a JSON manifest. Matching completed jobs are
skipped; changed source pixels or preset values trigger regeneration.
Game assets are never copied or installed by this CLI.
`;

export async function inputFiles(input) {
  const resolved = path.resolve(input),
    info = await stat(resolved);
  const supported = (name) => /\.(png|jpe?g|webp)$/i.test(name);
  if (info.isFile()) {
    if (!supported(resolved)) throw new Error('Input must be PNG, JPG, JPEG or WebP.');
    return [resolved];
  }
  if (!info.isDirectory()) throw new Error('Input must be an image file or folder.');
  const files = (await readdir(resolved, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && supported(entry.name))
    .map((entry) => path.join(resolved, entry.name))
    .sort();
  if (!files.length) throw new Error('No PNG, JPG, JPEG or WebP images found in the input folder.');
  return files;
}

async function completed(destination, jobHash) {
  try {
    const metadata = JSON.parse(await readFile(`${destination}.json`, 'utf8'));
    if (metadata.jobHash !== jobHash) return false;
    const zip = await readFile(destination);
    return zip.length >= 22 && zip.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return false;
    throw error;
  }
}

export async function convertBatch(options, dependencies = {}) {
  const { input, output, force = false, channel = 'msedge', headed = false } = options;
  const preset = validatePreset(options.preset);
  const files = await inputFiles(input);
  const outputDir = path.resolve(output);
  await mkdir(outputDir, { recursive: true });
  const log = dependencies.log ?? console.log,
    errorLog = dependencies.error ?? console.error;
  const createConverter = dependencies.createConverter ?? createPbrForge;
  const cleanup = dependencies.cleanupArchive ?? cleanupArchive;
  const result = { converted: 0, skipped: 0, failed: 0, files: [] };
  let converter;
  try {
    for (const source of files) {
      const name = path.basename(source);
      const destination = path.join(outputDir, `${name}_${preset.name}_pbr_pack.zip`);
      const partial = `${destination}.${randomUUID()}.partial`;
      try {
        const sourceHash = createHash('sha256')
          .update(await readFile(source))
          .digest('hex');
        const jobHash = createHash('sha256')
          .update(JSON.stringify({ sourceHash, preset }))
          .digest('hex');
        if (!force && (await completed(destination, jobHash))) {
          await cleanup(destination);
          result.skipped++;
          result.files.push({ source, destination, status: 'skipped' });
          log(`SKIP ${name}: source and preset match the completed export`);
          continue;
        }
        converter ??= await createConverter({ channel, headed });
        const actual = await converter.convert(
          source,
          partial,
          preset,
          `${destination}.failure.png`,
        );
        const zip = await readFile(partial);
        if (zip.length < 22 || !zip.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])))
          throw new Error('PBR Forge did not return a ZIP archive.');
        await writeFile(
          `${partial}.json`,
          JSON.stringify(
            {
              version: 1,
              source: name,
              sourceHash,
              jobHash,
              generator: 'https://www.pbrforge.com/',
              preset,
              actual,
            },
            null,
            2,
          ) + '\n',
        );
        await cleanup(partial);
        await rename(partial, destination);
        await rename(`${partial}.json`, `${destination}.json`);
        result.converted++;
        result.files.push({ source, destination, status: 'converted' });
        log(`OK ${name} -> ${destination}`);
        if (actual.skipped?.length)
          log(`Mode ${actual.mode}: omitted Sprite-only settings ${actual.skipped.join(', ')}`);
      } catch (error) {
        result.failed++;
        result.files.push({ source, destination, status: 'failed', error: error.message });
        errorLog(`FAIL ${name}: ${error.message}`);
      } finally {
        await rm(partial, { force: true });
        await rm(`${partial}.json`, { force: true });
      }
    }
  } finally {
    await converter?.close();
  }
  log(`${result.converted} converted, ${result.skipped} skipped, ${result.failed} failed`);
  return result;
}

export async function main(argv = process.argv.slice(2), dependencies = {}) {
  const { values } = parseArgs({
    args: argv,
    options: {
      input: { type: 'string' },
      output: { type: 'string' },
      preset: { type: 'string', default: 'default' },
      mode: { type: 'string' },
      engine: { type: 'string' },
      force: { type: 'boolean', default: false },
      headed: { type: 'boolean', default: false },
      channel: { type: 'string', default: 'msedge' },
      'list-presets': { type: 'boolean' },
      help: { type: 'boolean' },
    },
  });
  const log = dependencies.log ?? console.log;
  if (values.help) {
    log(HELP);
    return 0;
  }
  if (values['list-presets']) {
    log((await listPresets()).join('\n'));
    return 0;
  }
  if (!values.input || !values.output)
    throw new Error('Both --input and --output are required. Use --help for usage.');
  const preset = await loadPreset(values.preset);
  if (values.mode) preset.mode = values.mode;
  if (values.engine) preset.engine = values.engine;
  const result = await convertBatch({ ...values, preset }, dependencies);
  return result.failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(`PBR: ${error.message}`);
      process.exitCode = 1;
    });
}
