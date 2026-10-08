export function foxfirePose(player: Readonly<{ x: number; y: number; h: number }>, time: number) {
  return {
    x: player.x + player.h * 0.34 + Math.cos(time * 1.4) * player.h * 0.05,
    y: player.y - player.h * 1.02 + Math.sin(time * 2.8) * player.h * 0.025,
    radius: Math.max(6, player.h * 0.035),
  };
}
