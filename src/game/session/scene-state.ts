/** Scene request and continuation lifetime, separate from serializable combat data. */
export function createSceneState() {
  return {
    sceneLoading: false, sceneReadyToPresent: false, sceneRequest: 0,
    requestedSceneKey: '', requestedSceneIdentity: '',
    sceneContinuation: undefined as (() => void) | undefined,
  };
}
