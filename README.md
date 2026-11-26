# Orca Tool Activity

Orca Tool Activity is an independent macOS preview based on [Orca 1.4.278](https://github.com/stablyai/orca/releases/tag/v1.4.278). Its local Codex Chat adds colored tool icons, live elapsed time, and a compact summary of tool calls, failures, and interruptions. Timing uses the start and end events observed by Orca and is available after reopening the session. Older calls with incomplete timing still display their details.

## Install on Apple Silicon

1. Download `Orca-Tool-Activity-macos-arm64.zip` and `SHA256SUMS` from [GitHub Releases](https://github.com/zibochen6/orca-tool-activity/releases).
2. In the download folder, run `shasum -a 256 -c SHA256SUMS`.
3. Extract the archive, move **Orca Tool Activity.app** to Applications, and open it. Start a local Codex Chat and run a task that reads a file and runs a command.

This preview is ad-hoc signed and has no Apple notarization. macOS may block a browser-downloaded copy. The source build below is available if you prefer to build it locally.

The app stores its settings and sessions in `~/Library/Application Support/Orca Tool Activity`. Its optional shell command is `orca-tool-activity`.

## Update or roll back

Quit **Orca Tool Activity**, download and verify the desired ZIP, then replace **Orca Tool Activity.app**. Release updates are manual. Keep your application data folder for existing sessions. Before rolling back across upstream Orca versions, back up the application data folder and check the release notes for storage changes.

## Build and maintain

Use an Apple Silicon Mac with Xcode, Node 24, the pnpm version pinned in `package.json`, and the Bun version in `config/.bun-version`. Git tags identify published sources.

```sh
git clone https://github.com/zibochen6/orca-tool-activity.git
cd orca-tool-activity
git checkout v1.4.278-activity.1
pnpm install --frozen-lockfile
pnpm -C mobile install --frozen-lockfile
node config/scripts/desktop-distribution/macos/build-tool-activity-preview.mjs 1.4.278-activity.1
```

Find the ZIP and checksum under `dist/tool-activity/<version>/`. Maintainers run `pnpm check:changed --base=v1.4.278`, build from a clean commit, launch the packaged app alongside official Orca, and smoke-test the Codex chat. Tag that commit as `v<upstream-version>-activity.<revision>` and attach its ZIP and checksum to a GitHub prerelease. Keep [stablyai/orca](https://github.com/stablyai/orca) as the `upstream` remote for future updates.

The upstream code and this distribution are available under the [MIT license](LICENSE).
