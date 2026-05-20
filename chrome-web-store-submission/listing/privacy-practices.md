# Chrome Web Store privacy practices draft

Use this as a dashboard entry guide. Confirm every answer against the exact release build before submission.

## Single purpose

wowMD improves reading of public GitHub README and Markdown pages by adding an outline, structured reading panel, and local full-screen reader.

## Data usage

wowMD's reading features do not collect or transmit personal data to the developer.

The extension reads supported GitHub page content locally in the browser and, after user action, may fetch the current public Markdown document from GitHub, raw.githubusercontent.com, or api.github.com to render the reading experience.

## Data categories

Recommended disclosure:

- Personally identifiable information: Yes, only if a user voluntarily provides an email address through the website feedback flow
- Health information: No
- Financial and payment information: No
- Authentication information: No
- Personal communications: No
- Location: No
- Web history: No
- User activity: No
- Website content: Yes, only the current public GitHub Markdown page needed to provide the reader

## Remote code

The extension does not load remote executable code. Third-party libraries are bundled in `extension/lib/`.

## Website feedback

The extension's reading features do not collect personal data.

The website includes an optional feedback form. If a user submits feedback, the website may receive the submitted message, selected feature preferences, optional email address, locale, page URL, user agent, and a hashed IP value for abuse prevention. This feedback flow is separate from the extension's reading features and is used only to read feedback, prevent abuse, and follow up on requested features.

## Third-party sharing

wowMD does not sell or share reading data.

## Privacy policy URL

https://wowmd.app/privacy.html
