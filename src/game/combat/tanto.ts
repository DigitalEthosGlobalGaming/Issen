/** Consume a run-local strike only for a living opponent about to cause damage. */
export function interceptWithTanto(
  run: { state: string; panel?: unknown; tanto: number },
  opponent: { state: string } | null,
): boolean {
  if (
    !['playing', 'boss', 'standoff'].includes(run.state) ||
    run.panel ||
    run.tanto <= 0 ||
    !opponent ||
    ['enter', 'dying', 'fade', 'strike', 'hurt'].includes(opponent.state)
  )
    return false;
  run.tanto--;
  return true;
}
