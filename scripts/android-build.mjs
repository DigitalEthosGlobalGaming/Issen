import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isAbsolute, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const target = process.argv[2];
if (!['apk', 'bundle'].includes(target)) {
  console.error('Usage: node scripts/android-build.mjs apk|bundle');
  process.exit(1);
}
const android = fileURLToPath(new URL('../android/', import.meta.url));
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (!(sdk && existsSync(sdk)) && !existsSync(join(android, 'local.properties'))) {
  console.error(
    'Android SDK not configured. Install Android Studio + SDK 36, open android/ once, ' +
      'or set ANDROID_HOME. See docs/development/android.md.',
  );
  process.exit(1);
}
if (target === 'bundle') {
  const signing = [
    'ISSEN_UPLOAD_STORE_FILE',
    'ISSEN_UPLOAD_STORE_PASSWORD',
    'ISSEN_UPLOAD_KEY_ALIAS',
    'ISSEN_UPLOAD_KEY_PASSWORD',
    'ISSEN_ANDROID_VERSION_CODE',
  ];
  if (signing.some((key) => !process.env[key])) {
    console.error('Set the ISSEN_UPLOAD_* signing variables and ISSEN_ANDROID_VERSION_CODE first.');
    process.exit(1);
  }
  if (
    !isAbsolute(process.env.ISSEN_UPLOAD_STORE_FILE) ||
    !existsSync(process.env.ISSEN_UPLOAD_STORE_FILE)
  ) {
    console.error(
      'ISSEN_UPLOAD_STORE_FILE must be the absolute path to an existing upload keystore.',
    );
    process.exit(1);
  }
  if (
    !/^[1-9]\d*$/.test(process.env.ISSEN_ANDROID_VERSION_CODE) ||
    Number(process.env.ISSEN_ANDROID_VERSION_CODE) > 2100000000
  ) {
    console.error(
      'ISSEN_ANDROID_VERSION_CODE must be a positive integer no larger than 2100000000.',
    );
    process.exit(1);
  }
}
const task = target === 'apk' ? 'assembleDebug' : 'bundleRelease';
// Fixed task names only; signing values remain environment variables, never shell arguments.
const result =
  process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', `gradlew.bat --no-daemon ${task}`], {
        cwd: android,
        stdio: 'inherit',
      })
    : spawnSync('bash', ['./gradlew', '--no-daemon', task], { cwd: android, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
