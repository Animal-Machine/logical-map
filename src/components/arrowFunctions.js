export function calculateArrowEnds({ x, y, w, h }, { X, Y, W, H }) {
// the first argument represents a tile position and dimensions,
// the second one represents either another tile or the mouse pointer position
// (so W and H can be undefined)

  if (y < Y) { y += h; } else { if (H) {Y += H} }
    // connects the bottom border of the tile above to the top border of the other tile

  x = Math.round(x + w/2);
  if (W) {X = Math.round(X + W/2)}
    // the arrow joins the tiles at the center of their borders

  return [x, y, X, Y];
}

export function drawDoubleArrow(ctx, [ x1, y1, x3, y3 ]) {
// Draws a double arrow in the canvas context "ctx" from (x1, y1) to (x3, y3)

  let y2 = Math.round((y1 + y3) / 2); // where the arrow turns
  let t = 8; // thickness (half the space between the two lines)
  let s = (x1-x3)*(y1-y3)>0 ? t : -t; // shift (used at arrow corners)
  let c = y1<y3 ? t : -t; // cut (used at the arrow's head)

  // First line
  ctx.moveTo(x1-t, y1);
  ctx.lineTo(x1-t, y2+s);
  ctx.lineTo(x3-t, y2+s);
  ctx.lineTo(x3-t, y3-c);

  // Second line
  ctx.moveTo(x1+t, y1);
  ctx.lineTo(x1+t, y2-s);
  ctx.lineTo(x3+t, y2-s);
  ctx.lineTo(x3+t, y3-c);

  // Tip
  ctx.moveTo(x3-2*c, y3-2*c);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x3+2*c, y3-2*c);
}

export function getArrowHitbox([ x1, y1, x3, y3 ]) {

  let y2 = Math.round((y1 + y3) / 2); // where the arrow turns
  let t = 8; // thickness (half the space between the two lines)
  t += 1;

  let rect1 = [x1-t, Math.min(y1,y2-t), 2*t, Math.abs(y2-y1)+t];
  let rect3 = [x3-t, Math.min(y3,y2-t), 2*t, Math.abs(y3-y2)+t];
  let rect2 = [Math.min(x1,x3)-t, y2-t, Math.abs(x3-x1)+2*t, 2*t];

  return [rect1, rect2, rect3];

}

export function getButtonBox([ x1, y1, x3, y3 ]) {
  let bs = 44; // button size
  return [(x1+x3)/2-bs/2, (y1+y3)/2-bs/2, bs];
}
