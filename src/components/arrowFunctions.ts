import { Point, Rectangle, PointOrRectangle, Coords, isCoords, DoubleCoords, isDoubleCoords, CoordsOrArray } from '../coordTypes';



export function calculateArrowCoords({tilesFrom, tilesTo}: {tilesFrom: Rectangle[], tilesTo: Rectangle[]}): DoubleCoords | CoordsOrArray[] {

  let coords: DoubleCoords | CoordsOrArray[];

  // Functions used to calculate means and deviations

  function tileSum(previous: Coords, current: Rectangle): Coords {
    return [previous[0] + current.x, previous[1] + current.y];
  }
  function tileSumQuadraticDeviations(mean: Coords): (previous: Coords, current: Rectangle) => Coords {
    return function (previous: Coords, current: Rectangle): Coords {
      return [previous[0] + (current.x - mean[0])**2, previous[1] + (current.y - mean[1])**2]
    }
  }

  if (tilesFrom.length === 1 && tilesTo.length === 1) {
    coords = calculateArrowEnds(tilesFrom[0], tilesTo[0]);
  }
  else if (tilesFrom.length === 0 && tilesTo.length > 0) {
    throw new Error("The arrow must start from somewhere.");
    coords = [0, 0, 0, 0];
  }
  else {

    // mean of tilesFrom coordinates
    let fromMean = tilesFrom.reduce(tileSum, [0, 0]);
    fromMean[0] /= tilesFrom.length;
    fromMean[1] /= tilesFrom.length;

    // mean of tilesTo coordinates
    let toMean = tilesTo.reduce(tileSum, [0, 0]);
    toMean[0] /= tilesTo.length;
    toMean[1] /= tilesTo.length;

    // mean of all tile coordinates
    let tilesAll = tilesFrom.concat(tilesTo);
    let allMean = tilesAll.reduce(tileSum, [0, 0]);
    allMean[0] /= tilesAll.length;
    allMean[1] /= tilesAll.length;


    // standard deviation of tilesFrom coordinates
    let fromSD = tilesFrom.reduce(tileSumQuadraticDeviations(fromMean), [0, 0]);
    fromSD[0] = Math.sqrt(fromSD[0] / tilesFrom.length);
    fromSD[1] = Math.sqrt(fromSD[1] / tilesFrom.length);

    // standard deviation of tilesTo coordinates
    let toSD = tilesTo.reduce(tileSumQuadraticDeviations(toMean), [0, 0]);
    toSD[0] = Math.sqrt(toSD[0] / tilesTo.length);
    toSD[1] = Math.sqrt(toSD[1] / tilesTo.length);

    // standard deviation of all tile coordinates
    let allSD = tilesAll.reduce(tileSumQuadraticDeviations(allMean), [0, 0]);
    allSD[0] = Math.sqrt(allSD[0] / (tilesAll.length));
    allSD[1] = Math.sqrt(allSD[1] / (tilesAll.length));


    // booleans indicating tile distribution
    const fromLineIsVertical = fromSD[0]/fromSD[1] - fromSD[1]/fromSD[0] < 0;
    const toLineIsVertical = toSD[0]/toSD[1] - toSD[1]/toSD[0] < 0;
    const globalLineIsVertical = allSD[0]/allSD[1] - allSD[1]/allSD[0] < 0;
    // a positive sd ratio difference means tiles are more scattered among x than among y, negative means the opposite


    const d1 = 30; // minimum distance from tile to line
    const d2 = 12; // size of the arrow head
    // box around all "from" tiles:
    const fromBottom = Math.max(...tilesFrom.map((t: Rectangle): number => t.y + t.h)) + d1;
    const fromTop    = Math.min(...tilesFrom.map((t: Rectangle): number => t.y      )) - d1;
    const fromRight  = Math.max(...tilesFrom.map((t: Rectangle): number => t.x + t.w)) + d1;
    const fromLeft   = Math.min(...tilesFrom.map((t: Rectangle): number => t.x      )) - d1;
    // box around all "to" tiles:
    const toBottom = Math.max(...tilesTo.map((t: Rectangle): number => t.y + t.h)) + d1;
    const toTop    = Math.min(...tilesTo.map((t: Rectangle): number => t.y      )) - d1;
    const toRight  = Math.max(...tilesTo.map((t: Rectangle): number => t.x + t.w)) + d1;
    const toLeft   = Math.min(...tilesTo.map((t: Rectangle): number => t.x      )) - d1;

    let fromLineX:  number|null = null;
    let toLineX:    number|null = null;
    let fromLineY:  number|null = null;
    let toLineY:    number|null = null;
    let fromCoords: CoordsOrArray;
    let toCoords:   CoordsOrArray;

    let sameY = false;
    let sameX = false;

    // final coordinates of vertices

    if (tilesTo.length) {

      // ordinate comparisons
      if (fromBottom < toTop) {
        // if "from" tiles are above all "to" tiles:
        // lines below "from" tiles and above "to" tiles
        if (!fromLineIsVertical) {
          // horizontal "from" line
          fromLineY = fromBottom;
          fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y + t.h]]);
        }
        if (!toLineIsVertical) {
          // horizontal "to" line
          toLineY = toTop;
          toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, toLineY!], [t.x + t.w/2, t.y], [[t.x + t.w/2 - d2, t.y - d2], [t.x + t.w/2 + d2, t.y - d2]]]);
        }
      }
      else if (fromTop > toBottom) {
        // if "from" tiles are below all "to" tiles:
        // lines above "from" tiles and below "to" tiles
        if (!fromLineIsVertical) {
          fromLineY = fromTop;
          fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y]]);
        }
        if (!toLineIsVertical) {
          toLineY = toBottom;
          toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, toLineY!], [t.x + t.w/2, t.y + t.h], [[t.x + t.w/2 - d2, t.y + t.h + d2], [t.x + t.w/2 + d2, t.y + t.h + d2]]]);
        }
      }
      else { sameY = true; }

      // abscissa comparisons
      if (fromRight < toLeft) {
        // if "from" tiles are to the left of all "to" tiles:
        // lines to the right of "from" tiles and to the left of "to" tiles
        if (fromLineIsVertical) {
          fromLineX = fromRight;
          fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[fromLineX!, t.y + t.h/2], [t.x + t.w, t.y + t.h/2]]);
        }
        if (toLineIsVertical) {
          toLineX = toLeft;
          toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[toLineX!, t.y + t.h/2], [t.x, t.y + t.h/2], [[t.x - d2, t.y + t.h/2 - d2], [t.x - d2, t.y + t.h/2 + d2]]]);
        }
      }
      else if (fromLeft > toRight) {
        // if "from" tiles are to the right of all "to" tiles:
        // lines to the left of "from" tiles and to the right of "to" tiles
        if (fromLineIsVertical) {
          fromLineX = fromLeft;
          fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[fromLineX!, t.y + t.h/2], [t.x, t.y + t.h/2]]);
        }
        if (toLineIsVertical) {
          toLineX = toRight;
          toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[toLineX!, t.y + t.h/2], [t.x + t.w, t.y + t.h/2], [[t.x + t.w + d2, t.y + t.h/2 - d2], [t.x + t.w + d2, t.y + t.h/2 + d2]]]);
        }
      }
      else { sameX = true; }

      let parallelLines = false;
      let commonHorizontalLine = false;
      let commonVerticalLine = false;

      let fromLineEnds: Coords;
      let toLineEnds: Coords;
      (() => {
        function extractEnds(tiles: Rectangle[], isVertical: boolean): Coords {
          const T = tiles.map((t: Rectangle): number => isVertical ? t.y+t.h/2 : t.x+t.w/2);
          return [Math.min(...T), Math.max(...T)];
        }
        fromLineEnds = extractEnds(tilesFrom, fromLineIsVertical);
        toLineEnds = extractEnds(tilesTo, toLineIsVertical);
      })();

      let fromLineMiddle = (fromLineEnds[0] + fromLineEnds[1]) / 2;
      let toLineMiddle = (toLineEnds[0] + toLineEnds[1]) / 2;

      if (sameX && sameY) {
        // if the "from" and "to" frames overlap each other:
        // common vertical or horizontal line depending on global spreading
        if (globalLineIsVertical) { commonVerticalLine = true; }
        else { commonHorizontalLine = true; }
      }
      else if (sameX) {
        if (fromLineIsVertical && toLineIsVertical) { commonVerticalLine = true; }
          // if "from" and "two" tiles are both spread along a vertical axis:
          // common vertical line for "from" and "to" tiles
        else if (fromLineIsVertical) {
          // vertical "from" line and horizontal "to" line
          let leftBetween = (toLineEnds[0] <= fromLeft && fromLeft <= toLineEnds[1]);
          let rightBetween = (toLineEnds[0] <= fromRight && fromRight <= toLineEnds[1]);
          if (leftBetween && rightBetween) {
            leftBetween = (Math.abs(toLineMiddle - fromLeft) < Math.abs(toLineMiddle - fromRight));
            rightBetween = !leftBetween;
          }
          if (leftBetween) {
            fromLineX = fromLeft;
            fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[fromLineX!, t.y + t.h/2], [t.x, t.y + t.h/2]]);
          }
          else if (rightBetween) {
            fromLineX = fromRight;
            fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[fromLineX!, t.y + t.h/2], [t.x + t.w, t.y + t.h/2]]);
          }
          else if (fromLeft < toLineEnds[0]) {
            fromLineX = fromRight;
            fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[fromLineX!, t.y + t.h/2], [t.x + t.w, t.y + t.h/2]]);
          }
          else {
            fromLineX = fromLeft;
            fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[fromLineX!, t.y + t.h/2], [t.x, t.y + t.h/2]]);
          }
          toLineMiddle = fromLineX;
        }
        else if (toLineIsVertical) {
          // horizontal "from" line and vertical "to" line
          let leftBetween = (fromLineEnds[0] <= toLeft && toLeft <= fromLineEnds[1]);
          let rightBetween = (fromLineEnds[0] <= toRight && toRight <= fromLineEnds[1]);
          if (leftBetween && rightBetween) {
            leftBetween = (Math.abs(fromLineMiddle - toLeft) < Math.abs(fromLineMiddle - toRight));
            rightBetween = !leftBetween;
          }
          if (leftBetween) {
            toLineX = toLeft;
            toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[toLineX!, t.y + t.h/2], [t.x, t.y + t.h/2], [[t.x - d2, t.y + t.h/2 - d2], [t.x - d2, t.y + t.h/2 + d2]]]);
          }
          else if (rightBetween) {
            toLineX = toRight;
            toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[toLineX!, t.y + t.h/2], [t.x + t.w, t.y + t.h/2], [[t.x + t.w + d2, t.y + t.h/2 - d2], [t.x + t.w + d2, t.y + t.h/2 + d2]]]);
          }
          else if (toLeft < fromLineEnds[0]) {
            toLineX = toRight;
            toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[toLineX!, t.y + t.h/2], [t.x + t.w, t.y + t.h/2], [[t.x + t.w + d2, t.y + t.h/2 - d2], [t.x + t.w + d2, t.y + t.h/2 + d2]]]);
          }
          else {
            toLineX = toLeft;
            toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[toLineX!, t.y + t.h/2], [t.x, t.y + t.h/2], [[t.x - d2, t.y + t.h/2 - d2], [t.x - d2, t.y + t.h/2 + d2]]]);
          }
          fromLineMiddle = toLineX;
        }
        else {
          // "from" and "to" lines are both vertical
          parallelLines = true;
        }
      }
      else if (sameY) {
        if (!fromLineIsVertical && !toLineIsVertical) { commonHorizontalLine = true; }
          // if "from" and "two" tiles are already spread along a horizontal axis:
          // common horizontal line for "from" and "to" tiles
        else if (!fromLineIsVertical) {
          // horizontal "from" line and vertical "to" line
          let topBetween = (toLineEnds[0] <= fromTop && fromTop <= toLineEnds[1]);
          let bottomBetween = (toLineEnds[0] <= fromBottom && fromBottom <= toLineEnds[1]);
          if (topBetween && bottomBetween) {
            topBetween = (Math.abs(toLineMiddle - fromTop) < Math.abs(toLineMiddle - fromBottom));
            bottomBetween = !topBetween;
          }
          if (topBetween) {
            fromLineY = fromTop;
            fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y]]);
          }
          else if (bottomBetween) {
            fromLineY = fromBottom;
            fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y + t.h]]);
          }
          else if (fromTop < toLineEnds[0]) {
            fromLineY = fromBottom;
            fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y + t.h]]);
          }
          else {
            fromLineY = fromTop;
            fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y]]);
          }
          toLineMiddle = fromLineY;
        }
        else if (!toLineIsVertical) {
          // vertical "from" line and horizontal "to" line
          let topBetween = (fromLineEnds[0] <= toTop && toTop <= fromLineEnds[1]);
          let bottomBetween = (fromLineEnds[0] <= toBottom && toBottom <= fromLineEnds[1]);
          if (topBetween && bottomBetween) {
            topBetween = (Math.abs(fromLineMiddle - toTop) < Math.abs(fromLineMiddle - toBottom));
            bottomBetween = !topBetween;
          }
          if (topBetween) {
            toLineY = toTop;
            toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, toLineY!], [t.x + t.w/2, t.y], [[t.x + t.w/2 - d2, t.y - d2], [t.x + t.w/2 + d2, t.y - d2]]]);
          }
          else if (bottomBetween) {
            toLineY = toBottom;
            toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, toLineY!], [t.x + t.w/2, t.y + t.h], [[t.x + t.w/2 - d2, t.y + t.h + d2], [t.x + t.w/2 + d2, t.y + t.h + d2]]]);
          }
          else if (toTop < fromLineEnds[0]) {
            toLineY = toBottom;
            toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, toLineY!], [t.x + t.w/2, t.y + t.h], [[t.x + t.w/2 - d2, t.y + t.h + d2], [t.x + t.w/2 + d2, t.y + t.h + d2]]]);
          }
          else {
            toLineY = toTop;
            toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, toLineY!], [t.x + t.w/2, t.y], [[t.x + t.w/2 - d2, t.y - d2], [t.x + t.w/2 + d2, t.y - d2]]]);
          }
          fromLineMiddle = toLineY;
        }
        else {
          // "from" and "to" lines are both horizontal
          parallelLines = true;
        }
      }

      if (commonVerticalLine) {
        fromLineX = Math.max(fromRight, toRight); // right by default
        fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[fromLineX!, t.y + t.h/2], [t.x + t.w, t.y + t.h/2]]);
        toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[fromLineX!, t.y + t.h/2], [t.x + t.w, t.y + t.h/2], [[t.x + t.w + d2, t.y + t.h/2 - d2], [t.x + t.w + d2, t.y + t.h/2 + d2]]]);
        coords = [fromCoords[0][0] as Coords, fromCoords.concat(toCoords)];
      }
      else if (commonHorizontalLine) {
        fromLineY = Math.max(fromBottom, toBottom); // bottom by default
        fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y + t.h]]);
        toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y + t.h], [[t.x + t.w/2 - d2, t.y + t.h + d2], [t.x + t.w/2 + d2, t.y + t.h + d2]]]);
        coords = [fromCoords[0][0] as Coords, fromCoords.concat(toCoords)];
      }
      else {
        // coordinates in the middle

        if (parallelLines) {
          let overlappingZone: [number|null, number|null] = [null, null]
          if (fromLineEnds[0] <= toLineEnds[0] && toLineEnds[0] <= fromLineEnds[1]) {
            overlappingZone = [toLineEnds[0], Math.min(toLineEnds[1], fromLineEnds[1])];
          }
          else if (fromLineEnds[0] <= toLineEnds[1] && toLineEnds[1] <= fromLineEnds[1]){
            overlappingZone = [fromLineEnds[0], toLineEnds[1]];
          }
          else if (toLineEnds[0] <= fromLineEnds[0] && fromLineEnds[1] <= toLineEnds[1]) {
            overlappingZone = fromLineEnds;
          }

          if (overlappingZone[0] !== null) {
            let overlap = overlappingZone[1]! - overlappingZone[0] + 1;
            let toOverlap = overlap / (toLineEnds[1] - toLineEnds[0] + 1);
            let fromOverlap = overlap / (fromLineEnds[1] - fromLineEnds[0] + 1);
            toLineMiddle = (overlappingZone[0] + overlappingZone[1]!) / 2;
            fromLineMiddle = toLineMiddle;
          }
        }

        let fromPoint: CoordsOrArray = [fromLineMiddle, fromLineMiddle];
        let toPoint: CoordsOrArray = [toLineMiddle, toLineMiddle];
          // temporary values

        let middle = 0;
        let middleCoords: CoordsOrArray = [];

        if (tilesFrom.length > 1 && tilesTo.length > 1) {
          if (fromLineY !== null && toLineY !== null) {
            // two horizontal lines
            fromPoint[1] = fromLineY;
            toPoint[1] = toLineY;
            middle = (fromLineY + toLineY) / 2;
            middleCoords = [[fromLineMiddle, middle], [toLineMiddle, middle]];
          }
          else if (fromLineX !== null && toLineX !== null) {
            // two vertical lines
            fromPoint[0] = fromLineX;
            toPoint[0] = toLineX;
            middle = (fromLineX + toLineX) / 2;
            middleCoords = [[middle, fromLineMiddle], [middle, toLineMiddle]];
          }
          else if (fromLineY !== null && toLineX !== null) {
            // horizontal "from" line, vertical "to" line
            fromPoint[1] = fromLineY;
            toPoint[0] = toLineX;
            middleCoords = [[fromLineMiddle, toLineMiddle]];
          }
          else if (fromLineX !== null && toLineY !== null){
            // vertical "from" line, horizontal "to" line
            fromPoint[0] = fromLineX;
            toPoint[1] = toLineY;
            middleCoords = [[toLineMiddle, fromLineMiddle]];
          }
          else {
            throw new Error(`Impossible case: neither horizontal nor vertical line.
             fromLineX = ${fromLineX}
             toLineX = ${toLineX}
             fromLineY = ${fromLineY}
             toLineY = ${toLineY}`);
          }
          coords = [fromPoint, fromCoords!, ...middleCoords, toPoint, toCoords!];
        }

        else if (tilesFrom.length === 1) {
          // if there is only one "from" tile
          let t = tilesFrom[0];
          if (toLineX !== null) {
            // vertical line
            toPoint[0] = toLineX;
            if (toLineEnds[0] <= t.y + t.h/2 && t.y + t.h/2 <= toLineEnds[1]) {
              toPoint[1] = t.y + t.h/2;
              if (toLineX < t.x) { fromCoords = [t.x, t.y + t.h/2]; }
              else if (t.x + t.w < toLineX) { fromCoords = [t.x + t.w, t.y + t.h/2]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else if (Math.abs(t.x + t.w/2 - toLineX) > Math.abs(t.y + t.h/2 - toLineMiddle)) {
              middle = (toLineX + t.x) / 2;
              middleCoords = [[middle, t.y + t.h/2], [middle, toLineMiddle]];
              if (toLineX < t.x) { fromCoords = [t.x, t.y + t.h/2]; }
              else if (t.x + t.w < toLineX) { fromCoords = [t.x + t.w, t.y + t.h/2]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else {
              middleCoords = [[t.x + t.w/2, toLineMiddle]];
              if (toLineMiddle < t.y) { fromCoords = [t.x + t.w/2, t.y]; }
              else { fromCoords = [t.x + t.w/2, t.y + t.h]; }
            }
          }
          else if (toLineY !== null) {
            // horizontal line
            toPoint[1] = toLineY;
            if (toLineEnds[0] <= t.x + t.w/2 && t.x + t.w/2 <= toLineEnds[1]) {
              toPoint[0] = t.x + t.w/2;
              if (toLineY < t.y) { fromCoords = [t.x + t.w/2, t.y]; }
              else if (t.y + t.h < toLineY) { fromCoords = [t.x + t.w/2, t.y + t.h]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else if (Math.abs(t.y + t.h/2 - toLineY) > Math.abs(t.x + t.w/2 - toLineMiddle)) {
              middle = (toLineY + t.y) / 2;
              middleCoords = [[t.x + t.w/2, middle], [toLineMiddle, middle]];
              if (toLineY < t.y) { fromCoords = [t.x + t.w/2, t.y]; }
              else if (t.y + t.h < toLineY) { fromCoords = [t.x + t.w/2, t.y + t.h]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else {
              middleCoords = [[toLineMiddle, t.y + t.h/2]];
              if (toLineMiddle < t.x) { fromCoords = [t.x, t.y + t.h/2]; }
              else { fromCoords = [t.x + t.w, t.y + t.h/2]; }
            }
          }
          else {
            throw new Error(`Impossible case: neither horizontal nor vertical line.
             toLineX = ${toLineX}
             toLineY = ${toLineY}`);
          }
          coords = [fromCoords!, ...middleCoords, toPoint, toCoords!];
        }

        else {
          // if there is only one "to" tile
          // (same structure as the previous block, TODO: generalize?)
          let t = tilesTo[0];
          if (fromLineX !== null) {
            // vertical line
            fromPoint[0] = fromLineX;
            if (fromLineEnds[0] <= t.y + t.h/2 && t.y + t.h/2 <= fromLineEnds[1]) {
              fromPoint[1] = t.y + t.h/2;
              if (fromLineX < t.x) { toCoords = [[t.x, t.y + t.h/2], [[t.x - d2, t.y + t.h/2 - d2], [t.x - d2, t.y + t.h/2 + d2]]]; }
              else if (t.x + t.w < fromLineX) { toCoords = [[t.x + t.w, t.y + t.h/2], [[t.x + t.w + d2, t.y + t.h/2 - d2], [t.x + t.w + d2, t.y + t.h/2 + d2]]]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else if (Math.abs(t.x + t.w/2 - fromLineX) > Math.abs(t.y + t.h/2 - fromLineMiddle)) {
              middle = (fromLineX + t.x) / 2;
              middleCoords = [[middle, fromLineMiddle], [middle, t.y + t.h/2]];
              if (fromLineX < t.x) { toCoords = [[t.x, t.y + t.h/2], [[t.x - d2, t.y + t.h/2 - d2], [t.x - d2, t.y + t.h/2 + d2]]]; }
              else if (t.x + t.w < fromLineX) { toCoords = [[t.x + t.w, t.y + t.h/2], [[t.x + t.w + d2, t.y + t.h/2 - d2], [t.x + t.w + d2, t.y + t.h/2 + d2]]]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else {
              middleCoords = [[t.x + t.w/2, fromLineMiddle]];
              if (fromLineMiddle < t.y) { toCoords = [[t.x + t.w/2, t.y], [[t.x + t.w/2 - d2, t.y - d2], [t.x + t.w/2 + d2, t.y - d2]]]; }
              else { toCoords = [[t.x + t.w/2, t.y + t.h], [[t.x + t.w/2 - d2, t.y + t.h + d2], [t.x + t.w/2 + d2, t.y + t.h + d2]]]; }
            }
          }
          else if (fromLineY !== null) {
            // horizontal line
            fromPoint[1] = fromLineY;
            if (fromLineEnds[0] <= t.x + t.w/2 && t.x + t.w/2 <= fromLineEnds[1]) {
              fromPoint[0] = t.x + t.w/2;
              if (fromLineY < t.y) { toCoords = [[t.x + t.w/2, t.y], [[t.x + t.w/2 - d2, t.y - d2], [t.x + t.w/2 + d2, t.y - d2]]]; }
              else if (t.y + t.h < fromLineY) { toCoords = [[t.x + t.w/2, t.y + t.h], [[t.x + t.w/2 - d2, t.y + t.h + d2], [t.x + t.w/2 + d2, t.y + t.h + d2]]]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else if (Math.abs(t.y + t.h/2 - fromLineY) > Math.abs(t.x + t.w/2 - fromLineMiddle)) {
              middle = (fromLineY + t.y) / 2;
              middleCoords = [[fromLineMiddle, middle], [t.x + t.w/2, middle]];
              if (fromLineY < t.y) { toCoords = [[t.x + t.w/2, t.y], [[t.x + t.w/2 - d2, t.y - d2], [t.x + t.w/2 + d2, t.y - d2]]]; }
              else if (t.y + t.h < fromLineY) { toCoords = [[t.x + t.w/2, t.y + t.h], [[t.x + t.w/2 - d2, t.y + t.h + d2], [t.x + t.w/2 + d2, t.y + t.h + d2]]]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else {
              middleCoords = [[fromLineMiddle, t.y + t.h/2]];
              if (fromLineMiddle < t.x) { toCoords = [[t.x, t.y + t.h/2], [[t.x - d2, t.y + t.h/2 - d2], [t.x - d2, t.y + t.h/2 + d2]]]; }
              else { toCoords = [[t.x + t.w, t.y + t.h/2], [[t.x + t.w + d2, t.y + t.h/2 - d2], [t.x + t.w + d2, t.y + t.h/2 + d2]]]; }
            }
          }
          else {
            throw new Error(`Impossible case: neither horizontal nor vertical line.
             fromLineX = ${fromLineX}
             fromLineY = ${fromLineY}`);
          }
          coords = [fromPoint, fromCoords!, ...middleCoords, ...toCoords!];
        }
      }
    }

    else if (tilesFrom.length > 1) {
      // if there is no "to" tiles, it means we are in arrow mode and the user has not selected them yet
      if (fromLineIsVertical) {
        fromLineX = fromRight; // right by default
        fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[fromLineX!, t.y + t.h/2], [t.x + t.w, t.y + t.h/2]]);
      }
      else {
        fromLineY = fromBottom; // bottom by default
        fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y + t.h]]);
      }
      coords = [fromCoords[0][0] as Coords, fromCoords!];
    }

    else { coords = []; }

  }
  return coords;
}


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



// Unused for now:

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



export function getArrowHitbox(arrow: DoubleCoords | CoordsOrArray[]): [DoubleCoords, DoubleCoords, DoubleCoords] {

  if (isDoubleCoords(arrow)) {
    const [ x1, y1, x3, y3 ] = arrow;
    const y2 = Math.round((y1 + y3) / 2); // where the arrow turns
    let t = 8; // thickness (half the space between the two lines)
    t += 1;

    let rect1: DoubleCoords = [x1-t, Math.min(y1,y2-t), 2*t, Math.abs(y2-y1)+t];
    let rect3: DoubleCoords = [x3-t, Math.min(y3,y2-t), 2*t, Math.abs(y3-y2)+t];
    let rect2: DoubleCoords = [Math.min(x1,x3)-t, y2-t, Math.abs(x3-x1)+2*t, 2*t];

    return [rect1, rect2, rect3];
  }
  else {
    //TODO
    const zero: DoubleCoords = [0, 0, 0, 0];
    return [zero, zero, zero];
  }

}


export function getButtonBox(arrow: DoubleCoords | CoordsOrArray[]): [number, number, number] {
  if (isDoubleCoords(arrow)) {
    const [ x1, y1, x3, y3 ] = arrow;
    const w = 44; // button size
    return [(x1+x3)/2-w/2, (y1+y3)/2-w/2, w];
  }
  else {
    //TODO
    return [0, 0, 0];
  }
}
