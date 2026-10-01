/** Sleeveless war coat, drawn over the robe and its belt. */
export function drawJinbaori(
  g: CanvasRenderingContext2D,
  back: boolean,
  lean: number,
  time: number,
  wind: number,
) {
  g.save();
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const gold = '#b79a60';
  const sway = Math.sin(time * 2.4) * wind * 0.009;
  // Shear with the torso while allowing the lower panels to hang freely.
  g.transform(1, 0, -lean / 0.55, 1, -lean * 0.55, 0);
  const cloth = g.createLinearGradient(-0.2, 0, 0.2, 0);
  cloth.addColorStop(0, '#302a24');
  cloth.addColorStop(0.3, '#65523c');
  cloth.addColorStop(0.55, '#786247');
  cloth.addColorStop(0.8, '#524330');
  cloth.addColorStop(1, '#302820');

  // A full back with a central vent; the front is two open panels.
  for (const side of [-1, 1]) {
    g.save();
    g.scale(side, 1);
    const flutter = sway * side;
    g.fillStyle = cloth;
    g.strokeStyle = '#28221c';
    g.lineWidth = 0.006;
    g.beginPath();
    g.moveTo(back ? 0 : 0.045, -0.835);
    g.quadraticCurveTo(0.12, -0.838, 0.19, -0.79);
    g.lineTo(0.16, -0.719);
    g.quadraticCurveTo(0.12, -0.67, 0.136, -0.56);
    g.quadraticCurveTo(0.17, -0.43, 0.216 + flutter, -0.285);
    g.quadraticCurveTo(0.14, -0.26, 0.049 + flutter, -0.292);
    g.lineTo(back ? 0 : 0.032, -0.49);
    g.lineTo(back ? 0 : 0.04, -0.66);
    g.closePath();
    g.fill();
    g.stroke();

    // Quiet brocade folds, kept out of the crest area.
    g.strokeStyle = 'rgba(220,194,142,.18)';
    g.lineWidth = 0.005;
    g.beginPath();
    g.moveTo(0.103, -0.74);
    g.quadraticCurveTo(0.085, -0.52, 0.134 + flutter, -0.305);
    g.stroke();
    g.strokeStyle = 'rgba(22,17,12,.3)';
    g.lineWidth = 0.012;
    g.beginPath();
    g.moveTo(0.13, -0.57);
    g.quadraticCurveTo(0.12, -0.43, 0.168 + flutter, -0.3);
    g.stroke();

    g.strokeStyle = gold;
    g.lineWidth = 0.006;
    g.beginPath();
    g.moveTo(0.18, -0.788);
    g.lineTo(0.15, -0.722);
    g.quadraticCurveTo(0.11, -0.668, 0.127, -0.56);
    g.stroke();
    g.beginPath();
    g.moveTo(0.208 + flutter, -0.293);
    g.quadraticCurveTo(0.14, -0.271, 0.055 + flutter, -0.3);
    g.lineTo(back ? 0.006 : 0.04, -0.49);
    if (!back) g.lineTo(0.049, -0.665);
    g.stroke();

    if (!back) {
      // Oxblood turnbacks give the open front a distinct inner surface.
      g.fillStyle = '#68392e';
      g.beginPath();
      g.moveTo(0.037, -0.852);
      g.lineTo(0.093, -0.817);
      g.lineTo(0.065, -0.645);
      g.lineTo(0.032, -0.565);
      g.lineTo(0.042, -0.725);
      g.closePath();
      g.fill();
      g.strokeStyle = gold;
      g.lineWidth = 0.005;
      g.stroke();
    }
    g.restore();
  }
  if (back) {
    g.strokeStyle = 'rgba(29,22,16,.45)';
    g.lineWidth = 0.003;
    g.beginPath();
    g.moveTo(0, -0.76);
    g.lineTo(0, -0.49);
    g.stroke();
    g.fillStyle = '#68392e';
    g.strokeStyle = gold;
    g.lineWidth = 0.005;
    g.beginPath();
    g.moveTo(-0.075, -0.815);
    g.lineTo(-0.056, -0.858);
    g.quadraticCurveTo(0, -0.838, 0.056, -0.858);
    g.lineTo(0.075, -0.815);
    g.quadraticCurveTo(0, -0.786, -0.075, -0.815);
    g.fill();
    g.stroke();
  } else {
    g.strokeStyle = gold;
    g.lineWidth = 0.004;
    g.beginPath();
    g.moveTo(-0.037, -0.615);
    g.quadraticCurveTo(0, -0.593, 0.037, -0.615);
    g.stroke();
  }
  g.restore();
}
