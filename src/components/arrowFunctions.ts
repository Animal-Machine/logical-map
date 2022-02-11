import { Point, Rectangle, PointOrRectangle, Coords, isCoords, DoubleCoords, isDoubleCoords, CoordsOrArray } from '../types';


function tileSum(previous: Coords, current: Rectangle): Coords {
  return [previous[0] + current.x, previous[1] + current.y];
}

export function calculateArrowCoords({tilesFrom, tilesTo, mouse}: {tilesFrom: Rectangle[], tilesTo: Rectangle[], mouse?: Point}): DoubleCoords | CoordsOrArray[] {
  let coords: DoubleCoords | CoordsOrArray[];

  if (tilesFrom.length === 1 && tilesTo.length <= 1) {
    if (tilesTo.length === 1) {
      coords = calculateArrowEnds(tilesFrom[0], tilesTo[0]);
    }
    else if (mouse) {
      coords = calculateArrowEnds(tilesFrom[0], mouse);
    }
    else {
      throw new Error("Arrow is expected to point somewhere.");
      coords = [0, 0, 0, 0];
    }
  }
  else {
    // la moyenne des coordonnées des tilesFrom
    let tFromMean = tilesFrom.reduce(tileSum, [0, 0]);
    tFromMean[0] /= tilesFrom.length;
    tFromMean[1] /= tilesFrom.length;
    let tFromCoords = tilesFrom.map((t: Rectangle): Coords => [t.x, t.y]);

    if (tilesTo.length > 0) {
      // la moyenne des coordonnées des tilesTo
      let tToMean = tilesTo.reduce(tileSum, [0, 0]);
      tToMean[0] /= tilesTo.length;
      tToMean[1] /= tilesTo.length;
      let tToCoords = tilesTo.map((t: Rectangle): Coords => [t.x, t.y]);

      if (mouse) {
       tToCoords.push([mouse.x, mouse.y]);
      }
      coords = [tFromMean, tFromCoords, tToMean, tToCoords];
    }
    else if (!mouse) {
      throw new Error("Arrow is expected to point somewhere.");
      coords = [0, 0, 0, 0];
    }
    else {
      coords = [tFromMean, tFromCoords, [mouse.x, mouse.y]];
    }
  }
  return coords;
}

//function calculateArrowEnds({ x, y, w, h }: Rectangle, { x:X, y:Y, w:W, h:H }: { x: number, y: number, w: number|undefined, h: number|undefined}): DoubleCoords {
function calculateArrowEnds({ x, y, w, h }: Rectangle, { x:X, y:Y, w:W, h:H }: PointOrRectangle): DoubleCoords {
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



export function drawArrow(ctx: CanvasRenderingContext2D, coords: DoubleCoords | CoordsOrArray[]) {
  if (isDoubleCoords(coords)) {
    drawSimpleArrow(ctx, coords);
  } else {
    drawBranchedArrow(ctx, coords);
  }
}


function drawBranchedArrow(ctx: CanvasRenderingContext2D, coords: CoordsOrArray[]) {
  drawAcyclicGraph(ctx, coords);
  //TODO arrow tips
}


function drawSimpleArrow(ctx: CanvasRenderingContext2D, [ x1, y1, x3, y3 ]: DoubleCoords) {
// Draws a simple arrow in the canvas context "ctx" from (x1, y1) to (x3, y3)

  // Shaft
  let y2 = Math.round((y1 + y3) / 2); // where the arrow turns
  drawAcyclicGraph(ctx, [[x1, y1], [x1, y2], [x3, y2], [x3, y3]]);

  // Tip
  let w = 8; // width of the arrow tip
  w = y1<y3 ? w : -w;
  ctx.moveTo(x3-2*w, y3-2*w);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x3+2*w, y3-2*w);
}


export function drawAcyclicGraph(ctx: CanvasRenderingContext2D, vertices: CoordsOrArray[]) {
// Draws an acyclic graph, from an array that contains the coordinates of each vertice, arranged in a particalar manner described in the comments below.

  function traceChain(V: CoordsOrArray[]) {
  /* The parameter is a "chain array", it represents coords linked together in a chain,
   * and each coord can be followed by another type of array that represents a branching.
   * For example:
   * [A, B, [C, D], E]
   * represents
   * A──B──E
   *    │
   *    C──D
   */
    try {
      if (!isCoords(V[0])) {
        throw new Error("Wrong format. The first element of a chain must be of type Coords.");
      }
      ctx.moveTo(...V[0]);
      let j = 0; // index of the last Coords element
      for (let i = 1; i < V.length; i++) {
        if (isCoords(V[i])) {
          ctx.lineTo(...V[i] as Coords);
          j = i;
        } else {
          traceBranching(V[j] as Coords, V[i] as CoordsOrArray[]);
          ctx.moveTo(...V[j] as Coords);
        }
      }
    } catch (err) { console.error("While parsing graph array:", err); }
  }

  function traceBranching(v0: Coords, V: CoordsOrArray[]) {
  /* The parameter v0 represents the vertice at a branching,
   * which is linked with all elements of V, the "branching array".
   * The elements of V can be other coords, or chain arrays.
   * For example:
   * A, [[B, C], D, E]
   * represents
   * A──B──C
   * │╲
   * D E
   */
    for (let v of V) {
      ctx.moveTo(...v0);
      if (isCoords(v)) {
        ctx.lineTo(...v);
      } else {
        if (!isCoords(v[0])) {
          throw new Error("Wrong format. The first element of a chain must be of type Coords.");
        }
        ctx.lineTo(...v[0]);
        traceChain(v);
      }
    }
  }

  traceChain(vertices);

}



export function drawDoubleArrow(ctx: CanvasRenderingContext2D, [ x1, y1, x3, y3 ]: DoubleCoords) {
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


export function getArrowHitbox([ x1, y1, x3, y3 ]: DoubleCoords): [DoubleCoords, DoubleCoords, DoubleCoords] {

  let y2 = Math.round((y1 + y3) / 2); // where the arrow turns
  let t = 8; // thickness (half the space between the two lines)
  t += 1;

  let rect1: DoubleCoords = [x1-t, Math.min(y1,y2-t), 2*t, Math.abs(y2-y1)+t];
  let rect3: DoubleCoords = [x3-t, Math.min(y3,y2-t), 2*t, Math.abs(y3-y2)+t];
  let rect2: DoubleCoords = [Math.min(x1,x3)-t, y2-t, Math.abs(x3-x1)+2*t, 2*t];

  return [rect1, rect2, rect3];

}


export function getButtonBox([ x1, y1, x3, y3 ]: DoubleCoords) {
  let bs = 44; // button size
  return [(x1+x3)/2-bs/2, (y1+y3)/2-bs/2, bs];
}
