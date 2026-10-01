/** Carved lacquer masks; the player's mask is tied at the right temple. */
export function drawDemonMask(
  g: CanvasRenderingContext2D,
  variant: 'oni' | 'tengu',
  hx: number,
  hy: number,
  back: boolean,
) {
  g.save();
  g.translate(hx + (back ? 0.046 : 0), hy - 0.004);
  // Keep the side-mounted mask narrow while retaining its carved silhouette.
  g.scale(back ? 0.62 : 1, 1);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const ink = '#291713',
    ivory = '#dfc9a0';
  const lacquer = g.createLinearGradient(-0.045, -0.04, 0.045, 0.045);
  lacquer.addColorStop(0, '#65251e');
  lacquer.addColorStop(0.45, '#ba4932');
  lacquer.addColorStop(1, '#78251d');
  g.strokeStyle = ink;
  g.lineWidth = 0.004;
  g.fillStyle = lacquer;
  g.beginPath();
  g.moveTo(-0.035, -0.047);
  g.quadraticCurveTo(0, -0.064, 0.035, -0.047);
  g.quadraticCurveTo(0.049, -0.028, 0.043, 0.012);
  g.lineTo(0.03, 0.034);
  g.quadraticCurveTo(0.017, 0.055, 0, 0.052);
  g.quadraticCurveTo(-0.017, 0.055, -0.03, 0.034);
  g.lineTo(-0.043, 0.012);
  g.quadraticCurveTo(-0.049, -0.028, -0.035, -0.047);
  g.closePath();
  g.fill();
  g.stroke();

  for (const side of [-1, 1]) {
    g.save();
    g.scale(side, 1);
    if (variant === 'oni') {
      g.fillStyle = ivory;
      g.beginPath();
      g.moveTo(0.018, -0.046);
      g.quadraticCurveTo(0.023, -0.073, 0.039, -0.088);
      g.quadraticCurveTo(0.031, -0.06, 0.039, -0.042);
      g.closePath();
      g.fill();
      g.stroke();
    }
    // Deep eye sockets and a downward-sloping carved brow.
    g.fillStyle = ink;
    g.beginPath();
    g.moveTo(0.008, -0.01);
    g.lineTo(0.034, -0.023);
    g.quadraticCurveTo(0.036, -0.004, 0.013, -0.002);
    g.closePath();
    g.fill();
    g.strokeStyle = variant === 'oni' ? '#e07a50' : ink;
    g.lineWidth = variant === 'oni' ? 0.005 : 0.008;
    g.beginPath();
    g.moveTo(0.008, -0.019);
    g.quadraticCurveTo(0.021, -0.032, 0.036, -0.028);
    g.stroke();
    g.strokeStyle = '#d56a46';
    g.lineWidth = 0.003;
    g.beginPath();
    g.moveTo(0.035, 0.003);
    g.lineTo(0.022, 0.014);
    g.stroke();
    g.restore();
  }

  g.fillStyle = ink;
  g.beginPath();
  g.moveTo(-0.026, 0.024);
  g.quadraticCurveTo(0, variant === 'oni' ? 0.014 : 0.026, 0.026, 0.024);
  g.quadraticCurveTo(0, 0.049, -0.026, 0.024);
  g.fill();
  if (variant === 'oni') {
    for (const side of [-1, 1]) {
      g.fillStyle = ivory;
      g.beginPath();
      g.moveTo(side * 0.024, 0.031);
      g.quadraticCurveTo(side * 0.029, 0.022, side * 0.024, 0.014);
      g.lineTo(side * 0.015, 0.031);
      g.closePath();
      g.fill();
    }
    g.fillStyle = '#e07a50';
    g.beginPath();
    g.moveTo(0, -0.012);
    g.lineTo(0.011, 0.011);
    g.quadraticCurveTo(0, 0.018, -0.011, 0.011);
    g.closePath();
    g.fill();
  } else {
    // Rounded cylindrical nose, with a lit upper edge and shaded underside.
    g.fillStyle = lacquer;
    g.strokeStyle = ink;
    g.lineWidth = 0.003;
    g.beginPath();
    g.moveTo(0.002, -0.012);
    g.quadraticCurveTo(0.035, -0.009, 0.087, -0.002);
    g.bezierCurveTo(0.101, 0, 0.099, 0.015, 0.087, 0.016);
    g.lineTo(0.009, 0.014);
    g.quadraticCurveTo(-0.004, 0.01, 0.002, -0.012);
    g.fill();
    g.stroke();
    g.strokeStyle = '#e07a50';
    g.beginPath();
    g.moveTo(0.014, -0.006);
    g.lineTo(0.085, 0.003);
    g.stroke();
    g.strokeStyle = ink;
    g.beginPath();
    g.moveTo(-0.021, 0.022);
    g.quadraticCurveTo(-0.008, 0.015, 0.002, 0.023);
    g.stroke();
  }
  g.restore();
}
