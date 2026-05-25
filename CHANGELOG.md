# Changelog

All notable changes to wowMD will be documented in this file.

## [0.3.0-beta] - 2026-05-25

### Added

- `Continue in Web App` entry in the full-screen reader for public GitHub Markdown documents.
- Hover/focus tooltip explaining Web App benefits: better reading experience, highlights and remarks, HTML export for Pro users, and local access.
- Metadata-only Web App handoff using `source`, `rawUrl`, `pageUrl`, and optional GitHub source fields.

### Changed

- Bumped extension version to `0.3.0`.

### Privacy

- The Web App handoff does not put Markdown content, notes, highlights, license keys, email addresses, or tokens in the URL.

## [0.2.0-beta] - 2026-05-23

### Added

- Code copy buttons on code blocks in both the side panel and full-screen reader.
- One-click copy using the Clipboard API, with a fallback for older browsers.

### Changed

- Code block padding adjusted to accommodate the copy button.

## [0.1.0-beta] - 2026-05-20

Initial public beta release of the wowMD Chrome extension.

### Added

- Structured reading panel for long public GitHub README and Markdown pages.
- `Better View` entry point that appears only when a page is complex enough to benefit from structured reading.
- Outline-first panel with section navigation.
- Read view with a return path back to the outline.
- Extension-owned full-screen reader tab.
- H2 section folding for long documents.
- Code highlighting with bundled highlight.js.
- Safe Markdown rendering with markdown-it and DOMPurify.
- Horizontal scrolling for wide tables.
- Relative image path handling for common README image paths.
- Privacy-conscious behavior: no document fetch before the user clicks `Better View`.
- MIT license for source code and documentation.
- Brand asset policy reserving the wowMD name, icons, screenshots, demo video, and related brand-identifying assets.

### Notes

- Chrome Web Store submission is under review.
- Store submission materials are not included in the public repository.
