# Changelog

`public/changelog/index.html` is a standalone release-notes page, styled like the
privacy policy and linked from the title screen. Keep its newest release in sync
with package.json, package-lock.json, and the title version whenever implementation
changes ship. Notes should describe visible behavior, improvements and fixes.

Group recent patch releases under their minor version (for example, `1.70`).
The `1.73` summary also includes `1.71` and `1.72`. Keep each summary short,
combine repeated fixes, and explain the effect on play instead of listing
renderer internals or development tools. Older release history remains below
these summaries. Editorial regrouping does not change the app version or its
update notice.

`src/ui/changelog-link.ts` records the title version in `issen.releaseNotice` through
the profile-aware storage adapter. A first visit establishes a baseline. A later
version change underlines the link and labels it as a new update. The indication
survives refreshes until the player opens the link, which acknowledges the update.
Unavailable storage does not block startup or opening the page. Testing profiles
have separate notice state.
