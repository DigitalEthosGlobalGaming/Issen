export interface ReleaseNotice {
  opened: string;
  unread: boolean;
}

/** First visits establish a baseline; later releases stay highlighted until opened. */
export function nextReleaseNotice(raw: unknown, version: string): ReleaseNotice {
  const previous = raw && typeof raw === 'object' ? (raw as Partial<ReleaseNotice>) : null;
  return {
    opened: version,
    unread:
      typeof previous?.opened === 'string'
        ? previous.opened !== version || previous.unread === true
        : false,
  };
}
