import { Point, Rectangle, PointOrRectangle, Coords, isCoords, DoubleCoords, isDoubleCoords, CoordsOrArray, meanCoords, distInfCoords } from '../coordTypes';



function extractEnds(tiles: Rectangle[], isVertical: boolean): Coords {
  const T = tiles.map((t: Rectangle): number => isVertical ? t.y+t.h/2 : t.x+t.w/2);
  return [Math.min(...T), Math.max(...T)];
}

export function calculateArrowCoords({tilesFrom, tilesTo}: {tilesFrom: Rectangle[], tilesTo: Rectangle[]}): [CoordsOrArray[], Coords] {

  let coords: CoordsOrArray[] = [];
  let deleteButtonCoords: Coords = [0, 0];

  // Functions used to calculate means and deviations

  function tileSum(previous: Coords, current: Rectangle): Coords {
    return [previous[0] + current.x, previous[1] + current.y];
  }
  function tileSumQuadraticDeviations(mean: Coords): (previous: Coords, current: Rectangle) => Coords {
    return function (previous: Coords, current: Rectangle): Coords {
      return [previous[0] + (current.x - mean[0])**2, previous[1] + (current.y - mean[1])**2]
    }
  }


  if (tilesFrom.length === 0 && tilesTo.length > 0) {
    throw new Error("The arrow must start from somewhere.");
    coords = [];
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
    // (a positive sd ratio difference means tiles are more scattered among x than among y, negative means the opposite)
    const fromLineIsVertical = fromSD[0]/fromSD[1] - fromSD[1]/fromSD[0] < 0;
    const toLineIsVertical = toSD[0]/toSD[1] - toSD[1]/toSD[0] < 0;
    const fromLineIsHorizontal = fromSD[0]/fromSD[1] - fromSD[1]/fromSD[0] >= 0;
    const toLineIsHorizontal = toSD[0]/toSD[1] - toSD[1]/toSD[0] >= 0;
      // When there is only one tile at one side, sd = 0 so the ratio = NaN
      // In this case, both booleans are false.
      // This can also occur if tiles are stacked at the same position.
    const globalLineIsVertical = allSD[0]/allSD[1] - allSD[1]/allSD[0] < 0;
      // There cannot be only one tile in total, so globalLineIsHorizontal ~ !globalLineIsVertical
      // All the tiles can be at the same position but the code does not deal with this case.


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

    // reunion lines: lines linked with all "from" or "to" tiles when they are more than one
    let fromLineX:  number|null = null;
    let toLineX:    number|null = null;
    let fromLineY:  number|null = null;
    let toLineY:    number|null = null;
    let fromCoords: CoordsOrArray = [];
    let toCoords:   CoordsOrArray = [];

    let sameY = false;
    let sameX = false;


    /// Step 1: determining the reunion lines coordinates by comparing the relative positions of "from" and "to" groups of tiles

    /// First part: cases with different abscissae and ordinates for the two groups

    if (tilesTo.length) {

      // ordinate comparisons
      if (fromBottom < toTop) {
        // if "from" tiles are above all "to" tiles:
        // lines below "from" tiles and above "to" tiles
        if (fromLineIsHorizontal) {
          // horizontal "from" line
          fromLineY = fromBottom;
          fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y + t.h]]);
        }
        if (toLineIsHorizontal) {
          // horizontal "to" line
          toLineY = toTop;
          toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, toLineY!], [t.x + t.w/2, t.y], [[t.x + t.w/2 - d2, t.y - d2], [t.x + t.w/2 + d2, t.y - d2]]]);
        }
      }
      else if (fromTop > toBottom) {
        // if "from" tiles are below all "to" tiles:
        // lines above "from" tiles and below "to" tiles
        if (fromLineIsHorizontal) {
          fromLineY = fromTop;
          fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y]]);
        }
        if (toLineIsHorizontal) {
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


      /// Step 1, second part: dealing with the cases where the two groups have the same abscissa and/or ordinate

      const fromLineEnds = extractEnds(tilesFrom, fromLineIsVertical);
      const toLineEnds   = extractEnds(tilesTo,     toLineIsVertical);
      const fromLineMiddle = (fromLineEnds[0] + fromLineEnds[1]) / 2;
      const toLineMiddle   = (  toLineEnds[0] +   toLineEnds[1]) / 2;

      let parallelLines        = false;
      let commonHorizontalLine = false;
      let commonVerticalLine   = false;
      let fromLineJunction = fromLineMiddle;
      let toLineJunction   = toLineMiddle;

      if (sameX && sameY) {
        // if the "from" and "to" frames overlap each other:
        // common vertical or horizontal line depending on global spreading
        if (globalLineIsVertical) { commonVerticalLine = true; }
        else { commonHorizontalLine = true; }
      }
      else if (sameX) {
        // Note that this is NOT equivalent to (fromLineIsVertical && toLineIsVertical): it works when there is only one "from" tile XOR "to" tile
        if ((!fromLineIsHorizontal && toLineIsVertical) || (fromLineIsVertical && !toLineIsHorizontal)) { commonVerticalLine = true; }
          // if "from" and "two" tiles are both spread along a vertical axis:
          // common vertical line for "from" and "to" tiles
        else if (fromLineIsVertical) {
          // vertical "from" line and horizontal "to" line
          let leftBetween = (toLineEnds[0] <= fromLeft && fromLeft <= toLineEnds[1]);
          let rightBetween = (toLineEnds[0] <= fromRight && fromRight <= toLineEnds[1]);
          if (leftBetween && rightBetween) {
            // if both sides of the "from" box are between the abscissae of the ends of the "to" line, we choose the side the closest to the middle of the line
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
          toLineJunction = fromLineX;
        }
        else if (toLineIsVertical) {
          // horizontal "from" line and vertical "to" line
          let leftBetween = (fromLineEnds[0] <= toLeft && toLeft <= fromLineEnds[1]);
          let rightBetween = (fromLineEnds[0] <= toRight && toRight <= fromLineEnds[1]);
          if (leftBetween && rightBetween) {
            // if both sides of the "to" box are between the abscissae of the ends of the "from" line, we choose the side the closest to the middle of the line
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
          fromLineJunction = toLineX;
        }
        else {
          // "from" and "to" lines are both vertical
          parallelLines = true;
        }
      }
      else if (sameY) {
        if ((!fromLineIsVertical && toLineIsHorizontal) || (fromLineIsHorizontal && !toLineIsVertical)) { commonHorizontalLine = true; }
          // if "from" and "two" tiles are already spread along a horizontal axis:
          // common horizontal line for "from" and "to" tiles
        else if (fromLineIsHorizontal) {
          // horizontal "from" line and vertical "to" line
          let topBetween = (toLineEnds[0] <= fromTop && fromTop <= toLineEnds[1]);
          let bottomBetween = (toLineEnds[0] <= fromBottom && fromBottom <= toLineEnds[1]);
          if (topBetween && bottomBetween) {
            // if both sides of the "from" box are between the ordinates of the ends of the "to" line, we choose the side the closest to the middle of the line
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
          toLineJunction = fromLineY;
        }
        else if (toLineIsHorizontal) {
          // vertical "from" line and horizontal "to" line
          let topBetween = (fromLineEnds[0] <= toTop && toTop <= fromLineEnds[1]);
          let bottomBetween = (fromLineEnds[0] <= toBottom && toBottom <= fromLineEnds[1]);
          if (topBetween && bottomBetween) {
            // if both sides of the "to" box are between the ordinates of the ends of the "from" line, we choose the side the closest to the middle of the line
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
          fromLineJunction = toLineY;
        }
        else {
          // "from" and "to" lines are both horizontal
          parallelLines = true;
        }
      }


      /// Step 2: calculating coordinates of the path between the two lines, and final coordinates


      /// Cases of common line: end of step 1 and final coordinates directly

      if (commonVerticalLine && commonHorizontalLine) { throw new Error("Common line cannot be both horizontal and vertical."); }
      const commonLineEnds = extractEnds(tilesAll, commonVerticalLine);
      const commonLineMiddle = (commonLineEnds[0] + commonLineEnds[1]) / 2;

      if (commonVerticalLine) {
        fromLineX = Math.max(fromRight, toRight); // right by default
        fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[fromLineX!, t.y + t.h/2], [t.x + t.w, t.y + t.h/2]]);
        toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[fromLineX!, t.y + t.h/2], [t.x + t.w, t.y + t.h/2], [[t.x + t.w + d2, t.y + t.h/2 - d2], [t.x + t.w + d2, t.y + t.h/2 + d2]]]);
        coords = [fromCoords[0][0] as Coords, fromCoords.concat(toCoords)];
        deleteButtonCoords = [fromLineX, commonLineMiddle];
      }
      else if (commonHorizontalLine) {
        fromLineY = Math.max(fromBottom, toBottom); // bottom by default
        fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y + t.h]]);
        toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y + t.h], [[t.x + t.w/2 - d2, t.y + t.h + d2], [t.x + t.w/2 + d2, t.y + t.h + d2]]]);
        coords = [fromCoords[0][0] as Coords, fromCoords.concat(toCoords)];
        let commonLineMiddle = (Math.min(fromLineEnds[0], toLineEnds[0]) + Math.max(fromLineEnds[1], toLineEnds[1])) / 2;
        deleteButtonCoords = [commonLineMiddle, fromLineY];
      }


      else {

        /// Coordinates of the center path

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
            toLineJunction = (overlappingZone[0] + overlappingZone[1]!) / 2;
            fromLineJunction = toLineJunction;
          }
        }

        let fromJunctionPoint: Coords = [fromLineJunction, fromLineJunction];
        let toJunctionPoint:   Coords = [toLineJunction,   toLineJunction];
          // temporary values: for example, if fromLineIsVertical, fromJunctionPoint[0] will be replaced

        let center = 0;
        let centerPathCoords: CoordsOrArray = [];

        if (fromLineIsVertical) {
          if (fromLineX === null) { throw new Error("Missing value for fromLineX."); }
        } else if (fromLineIsHorizontal) {
          if (fromLineY === null) { throw new Error("Missing value for fromLineY."); }
        }
        if (toLineIsVertical) {
          if (toLineX === null) { throw new Error("Missing value for toLineX."); }
        } else if (toLineIsHorizontal) {
          if (toLineY === null) { throw new Error("Missing value for toLineY."); }
        }

        /// Case 1: more than one tile in both "from" and "to" groups

        if (tilesFrom.length > 1 && tilesTo.length > 1) {

          if (fromLineY !== null && toLineY !== null) {
            // two horizontal lines
            fromJunctionPoint[1] = fromLineY;
            toJunctionPoint[1] = toLineY;
            center = (fromLineY + toLineY) / 2;
            centerPathCoords = [[fromLineJunction, center], [toLineJunction, center]];
          }
          else if (fromLineX !== null && toLineX !== null) {
            // two vertical lines
            fromJunctionPoint[0] = fromLineX;
            toJunctionPoint[0] = toLineX;
            center = (fromLineX + toLineX) / 2;
            centerPathCoords = [[center, fromLineJunction], [center, toLineJunction]];
          }
          else if (fromLineY !== null && toLineX !== null) {
            // horizontal "from" line, vertical "to" line
            fromJunctionPoint[1] = fromLineY;
            toJunctionPoint[0] = toLineX;
            centerPathCoords = [[fromLineJunction, toLineJunction]];
          }
          else if (fromLineX !== null && toLineY !== null){
            // vertical "from" line, horizontal "to" line
            fromJunctionPoint[0] = fromLineX;
            toJunctionPoint[1] = toLineY;
            centerPathCoords = [[toLineJunction, fromLineJunction]];
          }
          else {
            throw new Error(`Impossible case: neither horizontal nor vertical line.
             fromLineX = ${fromLineX}
             toLineX = ${toLineX}
             fromLineY = ${fromLineY}
             toLineY = ${toLineY}`);
          }
          fromCoords = [fromJunctionPoint, fromCoords];
          toCoords = [toJunctionPoint, toCoords];
        }

        /// Case 2: one "from" tile, one "to" tile

        else if (tilesFrom.length === 1 && tilesTo.length === 1) {
          // if there is only one "from" and one "to" tiles
          const f = tilesFrom[0];
          const t = tilesTo[0];
          // Centers of mass:
          const fG: Coords = [f.x + f.w/2, f.y + f.h/2];
          const tG: Coords = [t.x + t.w/2, t.y + t.h/2];

          if (sameX) {
            if (fG[1] < tG[1]) {
              fromCoords = [[fG[0], f.y + f.h]];
              toCoords   = [[tG[0], t.y], [[tG[0] - d2, t.y - d2], [tG[0] + d2, t.y - d2]]];
            } else {
              fromCoords = [[fG[0], f.y]];
              toCoords   = [[tG[0], t.y + t.h], [[tG[0] - d2, t.y + t.h + d2], [tG[0] + d2, t.y + t.h + d2]]];
            }
            center = (fromCoords[0][1] as number + (toCoords[0][1] as number)) / 2;
            centerPathCoords = [[fG[0], center], [tG[0], center]];
          }
          else if (sameY) {
            if (fG[0] < tG[0]) {
              fromCoords = [[f.x + f.w, fG[1]]];
              toCoords   = [[t.x, tG[1]], [[t.x - d2, tG[1] - d2], [t.x - d2, tG[1] + d2]]];
            } else {
              fromCoords = [[f.x, fG[1]]];
              toCoords   = [[t.x + t.w, tG[1]], [[t.x + t.w + d2, tG[1] - d2], [t.x + t.w + d2, tG[1] + d2]]];
            }
            center = (fromCoords[0][0] as number + (toCoords[0][0] as number)) / 2;
            centerPathCoords = [[center, fG[1]], [center, tG[1]]];
          }
          else {
            fromCoords       = [[f.x,   fG[1]]];
            toCoords         = [[tG[0], t.y  ], []];
            centerPathCoords = [[tG[0], fG[1]]];
              // abscissa of "to" and ordinate of "from" by default (it could be the opposite)
              // consequence: the arrow tip can only point upwards or downwards (and the other end only leftwards or rightwards)
            fromCoords = fG[0] < tG[0] ? [[f.x + f.w, fG[1]]]
                                       : [[f.x,       fG[1]]];
            toCoords   = tG[1] < fG[1] ? [[tG[0], t.y + t.h], [[tG[0] - d2, t.y + t.h + d2], [tG[0] + d2, t.y + t.h + d2]]]
                                       : [[tG[0], t.y],       [[tG[0] - d2, t.y - d2],       [tG[0] + d2, t.y - d2]]];
          }
        }

        /// Case 3: one "from" tile, several "to" tiles

        else if (tilesFrom.length === 1) {
          let f = tilesFrom[0];
          if (toLineX !== null) {
            // vertical "to" line
            toJunctionPoint[0] = toLineX;
            if (toLineEnds[0] <= f.y + f.h/2 && f.y + f.h/2 <= toLineEnds[1]) {
              // if the ordinate of the "from" tile is between the ordinates of the "to" line ends:
              // straight horizontal junction line (middle path)
              toJunctionPoint[1] = f.y + f.h/2;
              if (toLineX < f.x) { fromCoords = [[f.x, f.y + f.h/2]]; } // if it is to the left of the line
              else if (f.x + f.w < toLineX) { fromCoords = [[f.x + f.w, f.y + f.h/2]]; } // if it is to the right of the line
              else { throw new Error("This shouldn't be happening."); }
            }
            else if (Math.abs(f.x + f.w/2 - toLineX) > Math.abs(f.y + f.h/2 - toLineJunction)) {
              // if the rectangle formed between the "to" tile and the junction point is more long than high:
              // Z-shaped junction line (middle path)
              if (toLineX < f.x) {
                fromCoords = [[f.x, f.y + f.h/2]];
                center = (toLineX + f.x) / 2;
              }
              else if (f.x + f.w < toLineX) {
                fromCoords = [[f.x + f.w, f.y + f.h/2]];
                center = (toLineX + f.x + f.w) / 2;
              }
              else { throw new Error("This shouldn't be happening."); }
              centerPathCoords = [[center, f.y + f.h/2], [center, toLineJunction]];
            }
            else {
              // if the rectangle formed between the "to" tile and the junction point is more high than long:
              // L-shaped junction line (middle path)
              centerPathCoords = [[f.x + f.w/2, toLineJunction]];
              if (toLineJunction < f.y) { fromCoords = [[f.x + f.w/2, f.y]]; }
              else { fromCoords = [[f.x + f.w/2, f.y + f.h]]; }
            }
          }
          else if (toLineY !== null) {
            // horizontal "to" line
            toJunctionPoint[1] = toLineY;
            if (toLineEnds[0] <= f.x + f.w/2 && f.x + f.w/2 <= toLineEnds[1]) {
              // if the abscissa of the "from" tile is between the abscissae of the "to" line ends:
              // straight vertical junction line (middle path)
              toJunctionPoint[0] = f.x + f.w/2;
              if (toLineY < f.y) { fromCoords = [[f.x + f.w/2, f.y]]; }
              else if (f.y + f.h < toLineY) { fromCoords = [[f.x + f.w/2, f.y + f.h]]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else if (Math.abs(f.y + f.h/2 - toLineY) > Math.abs(f.x + f.w/2 - toLineJunction)) {
              // if the rectangle formed between the "from" tile and the junction point is more high than long:
              // Z-shaped junction line (middle path)
              if (toLineY < f.y) {
                fromCoords = [[f.x + f.w/2, f.y]];
                center = (toLineY + f.y) / 2;
              }
              else if (f.y + f.h < toLineY) {
                fromCoords = [[f.x + f.w/2, f.y + f.h]];
                center = (toLineY + f.y + f.h) / 2;
              }
              else { throw new Error("This shouldn't be happening."); }
              centerPathCoords = [[f.x + f.w/2, center], [toLineJunction, center]];
            }
            else {
              // if the rectangle formed between the "from" tile and the junction point is more long than high:
              // L-shaped junction line (middle path)
              centerPathCoords = [[toLineJunction, f.y + f.h/2]];
              if (toLineJunction < f.x) { fromCoords = [[f.x, f.y + f.h/2]]; }
              else { fromCoords = [[f.x + f.w, f.y + f.h/2]]; }
            }
          }
          else {
            throw new Error(`Impossible case: neither horizontal nor vertical line.
             toLineX = ${toLineX}
             toLineY = ${toLineY}`);
          }
          toCoords = [toJunctionPoint, toCoords];
        }

        /// Case 4: one "to" tile, several "from" tiles
        // (same structure as the previous block)

        else {
          let t = tilesTo[0];
          if (fromLineX !== null) {
            // vertical "from" line
            fromJunctionPoint[0] = fromLineX;
            if (fromLineEnds[0] <= t.y + t.h/2 && t.y + t.h/2 <= fromLineEnds[1]) {
              // if the ordinate of the "to" tile is between the ordinates of the "to" line ends:
              // straight horizontal junction line (middle path)
              fromJunctionPoint[1] = t.y + t.h/2;
              if (fromLineX < t.x) { toCoords = [[t.x, t.y + t.h/2], [[t.x - d2, t.y + t.h/2 - d2], [t.x - d2, t.y + t.h/2 + d2]]]; }
              else if (t.x + t.w < fromLineX) { toCoords = [[t.x + t.w, t.y + t.h/2], [[t.x + t.w + d2, t.y + t.h/2 - d2], [t.x + t.w + d2, t.y + t.h/2 + d2]]]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else if (Math.abs(t.x + t.w/2 - fromLineX) > Math.abs(t.y + t.h/2 - fromLineJunction)) {
              // if the rectangle formed between the "to" tile and the junction point is more long than high:
              // Z-shaped junction line (middle path)
              if (fromLineX < t.x) {
                toCoords = [[t.x, t.y + t.h/2], [[t.x - d2, t.y + t.h/2 - d2], [t.x - d2, t.y + t.h/2 + d2]]];
                center = (fromLineX + t.x) / 2;
              }
              else if (t.x + t.w < fromLineX) {
                toCoords = [[t.x + t.w, t.y + t.h/2], [[t.x + t.w + d2, t.y + t.h/2 - d2], [t.x + t.w + d2, t.y + t.h/2 + d2]]];
                center = (fromLineX + t.x + t.w) / 2;
              }
              else { throw new Error("This shouldn't be happening."); }
              centerPathCoords = [[center, fromLineJunction], [center, t.y + t.h/2]];
            }
            else {
              // if the rectangle formed between the "to" tile and the junction point is more high than long:
              // L-shaped junction line (middle path)
              centerPathCoords = [[t.x + t.w/2, fromLineJunction]];
              if (fromLineJunction < t.y) { toCoords = [[t.x + t.w/2, t.y], [[t.x + t.w/2 - d2, t.y - d2], [t.x + t.w/2 + d2, t.y - d2]]]; }
              else { toCoords = [[t.x + t.w/2, t.y + t.h], [[t.x + t.w/2 - d2, t.y + t.h + d2], [t.x + t.w/2 + d2, t.y + t.h + d2]]]; }
            }
          }
          else if (fromLineY !== null) {
            // horizontal "from" line
            fromJunctionPoint[1] = fromLineY;
            if (fromLineEnds[0] <= t.x + t.w/2 && t.x + t.w/2 <= fromLineEnds[1]) {
              // if the abscissa of the "to" tile is between the abscissae of the "from" line ends:
              // straight vertical junction line (middle path)
              fromJunctionPoint[0] = t.x + t.w/2;
              if (fromLineY < t.y) { toCoords = [[t.x + t.w/2, t.y], [[t.x + t.w/2 - d2, t.y - d2], [t.x + t.w/2 + d2, t.y - d2]]]; }
              else if (t.y + t.h < fromLineY) { toCoords = [[t.x + t.w/2, t.y + t.h], [[t.x + t.w/2 - d2, t.y + t.h + d2], [t.x + t.w/2 + d2, t.y + t.h + d2]]]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else if (Math.abs(t.y + t.h/2 - fromLineY) > Math.abs(t.x + t.w/2 - fromLineJunction)) {
              // if the rectangle formed between the "to" tile and the junction point is more high than long:
              // Z-shaped junction line (middle path)
              if (fromLineY < t.y) {
                toCoords = [[t.x + t.w/2, t.y], [[t.x + t.w/2 - d2, t.y - d2], [t.x + t.w/2 + d2, t.y - d2]]];
                center = (fromLineY + t.y) / 2;
              }
              else if (t.y + t.h < fromLineY) {
                toCoords = [[t.x + t.w/2, t.y + t.h], [[t.x + t.w/2 - d2, t.y + t.h + d2], [t.x + t.w/2 + d2, t.y + t.h + d2]]];
                center = (fromLineY + t.y + t.h) / 2;
              }
              else { throw new Error("This shouldn't be happening."); }
              centerPathCoords = [[fromLineJunction, center], [t.x + t.w/2, center]];
            }
            else {
              // if the rectangle formed between the "to" tile and the junction point is more long than high:
              // L-shaped junction line (middle path)
              centerPathCoords = [[fromLineJunction, t.y + t.h/2]];
              if (fromLineJunction < t.x) { toCoords = [[t.x, t.y + t.h/2], [[t.x - d2, t.y + t.h/2 - d2], [t.x - d2, t.y + t.h/2 + d2]]]; }
              else { toCoords = [[t.x + t.w, t.y + t.h/2], [[t.x + t.w + d2, t.y + t.h/2 - d2], [t.x + t.w + d2, t.y + t.h/2 + d2]]]; }
            }
          }
          else {
            throw new Error(`Impossible case: neither horizontal nor vertical line.
             fromLineX = ${fromLineX}
             fromLineY = ${fromLineY}`);
          }
          fromCoords = [fromJunctionPoint, fromCoords];
        }

        if (!isCoords(fromCoords[0]) || !isCoords(toCoords[0])) {
          throw new Error("fromCoords[0] or toCoords[0] is not of type Coords.");
          // At this point, the first element of fromCoords and toCoords should be of type Coords.
          // This is required by drawAcyclicGraph and also by distInfCoords (Typescript which refuses
          // to compile without this block of code because of the latter).
        }
        if ((centerPathCoords.length === 1 || centerPathCoords.length === 2) && isCoords(centerPathCoords[0])) {
          if (centerPathCoords.length === 1) {
            // If the joining branch is in a "L" shape, the delete button will be placed at the middle
            // of the global path and not at the corner of the "L".
            const f = fromCoords[0];
            const j = centerPathCoords[0];
            const t = toCoords[0];
            const dFJ = distInfCoords(f, j);
            const dTJ = distInfCoords(t, j);
            const m = (dFJ + dTJ) / 2;
            if (m < dFJ) {
              deleteButtonCoords = meanCoords([f, j], [1-m/dFJ, m/dFJ]);
            } else {
              deleteButtonCoords = meanCoords([t, j], [1-m/dTJ, m/dTJ]);
            }
          }
          else if (isCoords(centerPathCoords[1])) { deleteButtonCoords = meanCoords(centerPathCoords as Coords[]); }
          else { throw new Error("Cannot place delete button because centerPathCoords[1] is not of type Coords."); }
        }
        else if (centerPathCoords.length === 0 ) {
          deleteButtonCoords = meanCoords([fromCoords[0], toCoords[0]]);
        }
        else {
          throw new Error("Cannot place delete button because of centerPathCoords wrong format.");
        }

        coords = [...fromCoords, ...centerPathCoords, ...toCoords];
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
      // no deleteButtonCoords in this case
    }

  }
  return [coords, deleteButtonCoords];
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
