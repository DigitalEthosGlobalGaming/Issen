import test from 'node:test';
import assert from 'node:assert/strict';
import { nextReleaseNotice } from '../../src/platform/release-notice.ts';

test('first visit and malformed saves establish a quiet baseline', () => {
  for (const raw of [null, 1, {}, { opened: 2 }]) {
    assert.deepEqual(nextReleaseNotice(raw, 'v1.27.0'), { opened: 'v1.27.0', unread: false });
  }
});
test('an update remains unread across reloads until acknowledged', () => {
  const updated = nextReleaseNotice({ opened: 'v1.26.1', unread: false }, 'v1.27.0');
  assert.equal(updated.unread, true);
  assert.equal(nextReleaseNotice(updated, 'v1.27.0').unread, true);
  assert.equal(nextReleaseNotice({ ...updated, unread: false }, 'v1.27.0').unread, false);
});
