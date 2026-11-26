import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const version = process.argv[2]
if (process.platform !== 'darwin' || process.arch !== 'arm64') {
  throw new Error('Build this preview on an Apple Silicon Mac.')
}
if (!/^\d+\.\d+\.\d+-activity\.[1-9]\d*$/.test(version ?? '')) {
  throw new Error(
    'Usage: node config/scripts/desktop-distribution/macos/build-tool-activity-preview.mjs X.Y.Z-activity.N'
  )
}

const output = resolve('dist', 'tool-activity', version)
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const env = {
  ...process.env,
  ORCA_TOOL_ACTIVITY_VERSION: version,
  ORCA_BUILD_COMMIT: commit,
  CSC_IDENTITY_AUTO_DISCOVERY: 'false',
  ORCA_COMPUTER_MACOS_SIGN_IDENTITY: '-'
}
for (const key of [
  'ORCA_MAC_RELEASE',
  'ORCA_MAC_HOURLY',
  'ORCA_MAC_DAILY',
  'ORCA_MAC_ADHOC',
  'CSC_LINK',
  'CSC_NAME',
  'ORCA_POSTHOG_WRITE_KEY',
  'ORCA_DIAGNOSTICS_TOKEN_URL'
]) {
  delete env[key]
}
for (const script of [
  'build:desktop:assets',
  'build:computer-macos',
  'build:keyboard-layout-macos',
  'build:process-footprint-macos',
  'build:socket-owner-macos',
  'build:notification-status-macos',
  'ensure:electron-runtime'
]) {
  execFileSync('pnpm', ['run', script], { env, stdio: 'inherit' })
}
mkdirSync(output, { recursive: true })
execFileSync(
  'pnpm',
  [
    'exec',
    'electron-builder',
    '--config',
    'config/electron-builder.config.cjs',
    '--mac',
    'dir',
    '--arm64',
    '--publish',
    'never',
    `-c.directories.output=${output}`
  ],
  { env, stdio: 'inherit' }
)

const archive = 'Orca-Tool-Activity-macos-arm64.zip'
execFileSync(
  'ditto',
  [
    '-c',
    '-k',
    '--sequesterRsrc',
    '--keepParent',
    join(output, 'mac-arm64', 'Orca Tool Activity.app'),
    join(output, archive)
  ],
  { stdio: 'inherit' }
)
const checksums = execFileSync('shasum', ['-a', '256', archive], { cwd: output, encoding: 'utf8' })
writeFileSync(join(output, 'SHA256SUMS'), checksums)
console.log(output)
