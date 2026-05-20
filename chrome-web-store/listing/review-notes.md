# Reviewer notes

wowMD is a beta Chrome extension for public GitHub Markdown reading.

## How to test

1. Install the extension.
2. Open a public GitHub repository README with enough structure, for example `https://github.com/facebook/react`.
3. Click `Better View` near the README.
4. Confirm that the right-side panel opens on the outline.
5. Click an outline item and confirm it switches to the Read view.
6. Click `Open full reader` and confirm the extension-owned reader tab opens.
7. Click the toolbar icon and confirm the popup opens with version, Better View guidance, and a link to `wowmd.app`.

## Expected behavior

- Short or simple README pages may not show `Better View`.
- The extension is intentionally limited to public GitHub README, `.md`, and `.markdown` pages.
- Private repositories, GitHub Issues, Pull Requests, Wikis, and non-GitHub websites are not supported in this beta.
- The toolbar popup is informational only. The main reading flow starts from the `Better View` button on supported GitHub Markdown pages.

## Network behavior

The extension should not request raw.githubusercontent.com or api.github.com before the user clicks `Better View`.

After user action, the extension may fetch the current public Markdown document from GitHub so it can render the reader.
