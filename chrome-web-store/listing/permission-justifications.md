# Permission justifications

These justifications match `extension/manifest.json`.

## `storage`

Used only to pass the current Markdown document from the GitHub page to the extension-owned full-screen reader tab through `chrome.storage.session`.

The extension does not use storage for user tracking, analytics, accounts, cloud sync, or persistent reading history.

## `https://github.com/*`

Used to detect supported public GitHub README and Markdown pages and inject the Better View entry point.

The extension does not run on non-GitHub websites.

## `https://raw.githubusercontent.com/*`

Used after the user opens Better View to fetch the current public Markdown file when the raw GitHub URL is available.

## `https://api.github.com/*`

Used as a fallback after user action when the raw Markdown URL is unavailable and the current public README or Markdown content needs to be retrieved from GitHub.

