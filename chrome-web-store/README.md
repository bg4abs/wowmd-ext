# Chrome Web Store submission kit

This directory collects the public listing material prepared for the wowMD Chrome Web Store submission.

Official references checked on 2026-05-19:

- Images: https://developer.chrome.com/docs/webstore/images/
- Listing quality guidance: https://developer.chrome.com/docs/webstore/best-listing
- Branding guidance: https://developer.chrome.com/docs/webstore/branding

## Ready assets

Required by the Chrome Web Store:

- Extension icon: `assets/icons/icon-128.png`
- Screenshots: `assets/screenshots/*.png`
- Small promotional image: `assets/promotional/small-promo-440x280.png`

Optional assets prepared:

- Large promotional image: `assets/promotional/large-promo-920x680.png`
- Marquee promotional image: `assets/promotional/marquee-promo-1400x560.png`

## Listing text

- English listing copy: `listing/en.md`
- Permission justifications: `listing/permission-justifications.md`
- Privacy practices draft: `listing/privacy-practices.md`
- Review notes: `listing/review-notes.md`

## Validation records

- Release test report: `checks/release-test-report.md`
- Release test results: `checks/release-test-results.json`
- Screenshot source video: `../tmp/video-edit/wowmd-demo-cut-v3-cropped.mp4`

## Package output

Put the final upload ZIP in `package/` when creating a release build. ZIP, CRX, and PEM files are intentionally ignored by Git.
