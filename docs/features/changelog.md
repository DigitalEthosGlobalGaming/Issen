# Changelog

`public/changelog/index.html` is a standalone release-notes page, styled like the
privacy policy and linked from the title screen. Keep its newest release in sync
with package.json, package-lock.json, and the title version whenever implementation
changes ship. Notes should describe visible behavior, improvements and fixes.

`src/ui/changelog-link.ts` records the title version in `issen.releaseNotice` through
the profile-aware storage adapter. A first visit establishes a baseline. A later
version change underlines the link and labels it as a new update. The indication
survives refreshes until the player opens the link, which acknowledges the update.
Unavailable storage does not block startup or opening the page. Testing profiles
have separate notice state.
