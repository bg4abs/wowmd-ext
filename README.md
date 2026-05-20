# wowMD English README

[中文说明](README.zh-CN.md)

wowMD is a lightweight Chrome extension that turns long public GitHub README and Markdown pages into a cleaner, structured reading experience.

## Overview

wowMD focuses on one small but common workflow: reading long and complex README files or `.md` / `.markdown` documents on GitHub.

When a supported page is complex enough to benefit from structured reading, wowMD shows a `Better View` button near the document. Clicking it opens a right-side panel. The panel starts with an outline, helping users understand the document structure and jump to the section they need.

For longer focused reading, users can click `Open full reader` at the bottom of the panel to open a full-screen reader in a new browser tab.

## Key Features

- **Appears only when useful**: short README pages stay clean and undisturbed.
- **Outline first**: the panel opens with a structured outline instead of duplicating the full document.
- **Outline navigation**: clicking an outline item switches to Read and scrolls to the matching heading.
- **Clear return path**: the Read view includes `← Back to outline`.
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

1. Install or load the wowMD Chrome extension.
2. Open a public GitHub repository README or Markdown file page, for example:
   - `https://github.com/facebook/react`
   - `https://github.com/owner/repo/blob/main/README.md`
3. If the document is complex enough, `Better View` appears near the document.
4. Click `Better View` to open the right-side panel.
5. Browse the `Outline`.
6. Click an outline item to switch to `Read` and scroll to the matching section.
7. Use `← Back to outline` at the top of Read to return to the outline.
8. Click `Open full reader` at the bottom of the panel to open the full-screen reader in a new tab.

## Full-Screen Reader

The full-screen reader is an extension-owned page. It does not navigate to a website and does not depend on `wowmd.app`.

It opens a `chrome-extension://.../reader/reader.html` tab and renders the current Markdown document locally in the browser.

The first version includes:

- Top brand bar, file path, and original GitHub link.
- Fixed left-side Outline.
- Main reading column.
- Independent document scrolling while the Outline stays visible.
- Subtle active-section highlighting in the Outline while reading.
- H2 folding.
- Code highlighting.
- Horizontal table scrolling.
- Relative image path fixing.

The right-side feature area is intentionally not shown yet. Future API, account, or premium features can be added later as independent modules without changing the local reading core.

## Complexity Filter

wowMD does not appear on every README.

It estimates document complexity from the already-rendered GitHub DOM, including:

- Heading count.
- H2 / H3 count.
- Code block count.
- Table count.
- List count.
- Text length.
- Rendered height.

If a document is short or structurally simple, wowMD stays quiet. This gives users a stable expectation: when `Better View` appears, the document is likely worth opening in structured reading mode.

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

## Local Development

1. Open Chrome.
2. Go to `chrome://extensions/`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the local `extension/` directory.
6. Open a public GitHub README or `.md` page to test.

## Release Checklist

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

## Status

- Current version: `0.1.0`
- Recommended release stage: Beta
