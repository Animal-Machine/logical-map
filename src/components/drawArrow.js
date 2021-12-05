export default function drawDoubleArrow(ctx, x1, y1, x3, y3) {
// Draws a double arrow in the canvas context "ctx" from (x1, y1) to (x3, y3)

  let y2 = Math.round((y1 + y3) / 2); // where the arrow turns
  let t = 8 // thickness (half the space between the two lines)
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

