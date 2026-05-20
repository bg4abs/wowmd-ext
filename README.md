# wowMD

[中文说明](README.zh-CN.md)

wowMD is a lightweight Chrome extension that turns long public GitHub README and Markdown pages into a cleaner, structured reading experience.

## What It Does

wowMD focuses on one common workflow: reading long and complex README files or `.md` / `.markdown` documents on GitHub.

When a supported page is complex enough to benefit from structured reading, wowMD shows a `Better View` button near the document. Clicking it opens a right-side panel with an outline, section navigation, and a reading view. For longer sessions, `Open full reader` opens an extension-owned full-screen reader in a new browser tab.

## Install

### Chrome Web Store

The Chrome Web Store version is currently under review. Store submission materials are not included in this public repository.

### Load Locally

Until the Chrome Web Store listing is approved, load the extension locally:

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the `extension/` directory.
6. Open a public GitHub README or `.md` page.

## Key Features

- **Appears only when useful**: short README pages stay clean and undisturbed.
- **Outline first**: the panel opens with a structured outline instead of duplicating the full document.
- **Outline navigation**: clicking an outline item switches to Read and scrolls to the matching heading.
- **Clear return path**: the Read view includes `Back to outline`.
- **Right-side reading panel**: GitHub remains the main page, while wowMD acts as a reading aid.
- **Full-screen reader**: `Open full reader` opens a local structured reader in a new tab.
- **Independent H2 folding**: long documents can be collapsed section by section.
- **Code highlighting**: code blocks stay readable whenever possible.
- **Horizontal table scrolling**: wide tables do not break the panel layout.
- **Relative image path fix**: common README image paths are rewritten so images can render.
- **Safe rendering**: rendered HTML is sanitized before insertion.
- **Friendly error states**: technical errors such as 403, 404, TypeError, or stack traces are not shown directly to users.

## Product Scope

wowMD v0.x is a reading aid, not a full documentation platform.

Currently supported:

- Public GitHub repository README pages.
- Public GitHub `.md` file pages.
- Public GitHub `.markdown` file pages.
- Right-side reading panel.
- Extension-owned full-screen reader tab.
- Document outline, reading view, H2 folding, code blocks, tables, and image path fixes.

Not currently supported:

- Private repositories.
- Non-GitHub websites.
- GitHub Issues, Pull Requests, Wiki pages, or other GitHub surfaces.
- Non-Markdown files.
- AI summaries, translation, editing, bookmarks, cloud sync, accounts, or settings.

Future premium features may be provided through the `wowmd.app` API, but the current full-screen reader remains local and does not upload document content.

## How to Use

1. Open a public GitHub repository README or Markdown file page, for example:
   - `https://github.com/facebook/react`
   - `https://github.com/owner/repo/blob/main/README.md`
2. If the document is complex enough, `Better View` appears near the document.
3. Click `Better View` to open the right-side panel.
4. Browse the `Outline`.
5. Click an outline item to switch to `Read` and scroll to the matching section.
6. Use `Back to outline` at the top of Read to return to the outline.
7. Click `Open full reader` at the bottom of the panel to open the full-screen reader in a new tab.

## Privacy

wowMD is designed to access as little as possible.

- It does not collect personal information.
- It does not upload document content to third-party services.
- It does not use AI, cloud analysis, or remote configuration.
- It does not read browsing history, cookies, account information, or local files.
- It does not request Raw Markdown or GitHub API content before the user clicks `Better View`.
- After the user clicks the entry, wowMD may request the current public Markdown document so it can render the reading panel or full-screen reader.
- The full-screen reader asks the background service worker to write the current document into `chrome.storage.session` temporarily; the data stays in browser session memory and is not persisted.

## Permissions

Host permissions declared in `manifest.json`:

- `https://github.com/*`: detect supported GitHub README / Markdown pages and inject the entry point.
- `https://raw.githubusercontent.com/*`: fetch public Markdown content after the user clicks the entry.
- `https://api.github.com/*`: fallback for public README / content retrieval when the Raw URL is unavailable.

Chrome permissions declared by the extension:

```json
"permissions": ["storage"]
```

`storage` is used only to pass the current document to the extension-owned full-screen reader tab through the background service worker and `chrome.storage.session`.

## Development

The extension is a Manifest V3 Chrome extension. The loadable extension root is `extension/`.

There is no build step for the current version. Edit the files under `extension/`, then reload the unpacked extension from `chrome://extensions/`.

Before release, verify:

- Long README pages show `Better View`.
- Short README pages do not show the entry.
- No `raw.githubusercontent.com` or `api.github.com/repos/...` request happens before the user clicks the entry.
- The panel opens on `Outline` by default.
- Outline item clicks switch to `Read`.
- `Open full reader` opens the full-screen reader in a new tab.
- Outline navigation, active-section highlighting, H2 folding, images, tables, and code blocks work in the full-screen reader.
- GitHub SPA navigation does not leave stale entries behind.
- The console has no obvious extension errors.

## Repository Layout

- `extension/`: Chrome extension source.
- `THIRD_PARTY_NOTICES.md`: bundled library license notices.
- `TRADEMARKS.md`: wowMD brand asset usage policy.

## License

Source code and documentation are licensed under the MIT License. The wowMD name, logos, icons, screenshots, promotional images, store listing artwork, and other brand-identifying assets are not licensed for reuse. See `LICENSE`, `TRADEMARKS.md`, and `THIRD_PARTY_NOTICES.md`.

If you fork or redistribute this project, replace the wowMD name, icons, screenshots, promotional images, and store listing artwork with your own brand assets.

## Status

- Current version: `0.1.0`
- Recommended release stage: Beta
