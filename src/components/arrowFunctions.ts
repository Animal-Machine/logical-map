import { Point, Rectangle, PointOrRectangle, Coords, isCoords, DoubleCoords, isDoubleCoords, CoordsOrArray, meanCoords, distInfCoords } from '../coordTypes';



export function calculateArrowCoords({tilesFrom, tilesTo}: {tilesFrom: Rectangle[], tilesTo: Rectangle[]}): [DoubleCoords | CoordsOrArray[], Coords] {

  let coords: DoubleCoords | CoordsOrArray[] = [];
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

  if (tilesFrom.length === 1 && tilesTo.length === 1) {
    coords = calculateArrowEnds(tilesFrom[0], tilesTo[0]);
    const [ x1, y1, x3, y3 ] = coords;
    deleteButtonCoords = [(x1+x3)/2, (y1+y3)/2];
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
    let fromCoords: CoordsOrArray = [];
    let toCoords:   CoordsOrArray = [];

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

      const fromLineMiddle = (fromLineEnds[0] + fromLineEnds[1]) / 2;
      const toLineMiddle = (toLineEnds[0] + toLineEnds[1]) / 2;
      let fromLineJunction = fromLineMiddle;
      let toLineJunction = toLineMiddle;

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
        if (!fromLineIsVertical && !toLineIsVertical) { commonHorizontalLine = true; }
          // if "from" and "two" tiles are already spread along a horizontal axis:
          // common horizontal line for "from" and "to" tiles
        else if (!fromLineIsVertical) {
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
        else if (!toLineIsVertical) {
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

      if (commonVerticalLine) {
        fromLineX = Math.max(fromRight, toRight); // right by default
        fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[fromLineX!, t.y + t.h/2], [t.x + t.w, t.y + t.h/2]]);
        toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[fromLineX!, t.y + t.h/2], [t.x + t.w, t.y + t.h/2], [[t.x + t.w + d2, t.y + t.h/2 - d2], [t.x + t.w + d2, t.y + t.h/2 + d2]]]);
        coords = [fromCoords[0][0] as Coords, fromCoords.concat(toCoords)];
        deleteButtonCoords = [fromLineX, fromLineMiddle];
      }
      else if (commonHorizontalLine) {
        fromLineY = Math.max(fromBottom, toBottom); // bottom by default
        fromCoords = tilesFrom.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y + t.h]]);
        toCoords = tilesTo.map((t: Rectangle): CoordsOrArray => [[t.x + t.w/2, fromLineY!], [t.x + t.w/2, t.y + t.h], [[t.x + t.w/2 - d2, t.y + t.h + d2], [t.x + t.w/2 + d2, t.y + t.h + d2]]]);
        coords = [fromCoords[0][0] as Coords, fromCoords.concat(toCoords)];
        deleteButtonCoords = [fromLineMiddle, fromLineY];
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
            toLineJunction = (overlappingZone[0] + overlappingZone[1]!) / 2;
            fromLineJunction = toLineJunction;
          }
        }

        let fromPoint: CoordsOrArray = [fromLineJunction, fromLineJunction];
        let toPoint: CoordsOrArray = [toLineJunction, toLineJunction];
          // temporary values: for example, if fromLineIsVertical, fromPoint[0] will be replaced

        let middle = 0;
        let joiningCoords: CoordsOrArray = [];

        if (fromLineIsVertical) {
          if (fromLineX === null) { throw new Error("Missing value for fromLineX."); }
        } else {
          if (fromLineY === null) { throw new Error("Missing value for fromLineY."); }
        }
        if (toLineIsVertical) {
          if (toLineX === null) { throw new Error("Missing value for toLineX."); }
        } else {
          if (toLineY === null) { throw new Error("Missing value for toLineY."); }
        }

        if (tilesFrom.length > 1 && tilesTo.length > 1) {
          if (fromLineY !== null && toLineY !== null) {
            // two horizontal lines
            fromPoint[1] = fromLineY;
            toPoint[1] = toLineY;
            middle = (fromLineY + toLineY) / 2;
            joiningCoords = [[fromLineJunction, middle], [toLineJunction, middle]];
          }
          else if (fromLineX !== null && toLineX !== null) {
            // two vertical lines
            fromPoint[0] = fromLineX;
            toPoint[0] = toLineX;
            middle = (fromLineX + toLineX) / 2;
            joiningCoords = [[middle, fromLineJunction], [middle, toLineJunction]];
          }
          else if (fromLineY !== null && toLineX !== null) {
            // horizontal "from" line, vertical "to" line
            fromPoint[1] = fromLineY;
            toPoint[0] = toLineX;
            joiningCoords = [[fromLineJunction, toLineJunction]];
          }
          else if (fromLineX !== null && toLineY !== null){
            // vertical "from" line, horizontal "to" line
            fromPoint[0] = fromLineX;
            toPoint[1] = toLineY;
            joiningCoords = [[toLineJunction, fromLineJunction]];
          }
          else {
            throw new Error(`Impossible case: neither horizontal nor vertical line.
             fromLineX = ${fromLineX}
             toLineX = ${toLineX}
             fromLineY = ${fromLineY}
             toLineY = ${toLineY}`);
          }
          fromCoords = [fromPoint, fromCoords];
          toCoords = [toPoint, toCoords];
        }

        else if (tilesFrom.length === 1) {
          // if there is only one "from" tile
          let t = tilesFrom[0];
          if (toLineX !== null) {
            // vertical line
            toPoint[0] = toLineX;
            if (toLineEnds[0] <= t.y + t.h/2 && t.y + t.h/2 <= toLineEnds[1]) {
              // if the center of the "from" tile is between the ordinates of the "to" line ends:
              // single horizontal line
              toPoint[1] = t.y + t.h/2;
              if (toLineX < t.x) { fromCoords = [[t.x, t.y + t.h/2]]; } // if it is to the left of the line
              else if (t.x + t.w < toLineX) { fromCoords = [[t.x + t.w, t.y + t.h/2]]; } // if it is to the right of the line
              else { throw new Error("This shouldn't be happening."); }
            }
            else if (Math.abs(t.x + t.w/2 - toLineX) > Math.abs(t.y + t.h/2 - toLineJunction)) {
              // if the center of the "from" tile is closer to the "to" line abscissa than to the junction ordinate:
              middle = (toLineX + t.x) / 2;
              joiningCoords = [[middle, t.y + t.h/2], [middle, toLineJunction]];
              if (toLineX < t.x) { fromCoords = [[t.x, t.y + t.h/2]]; }
              else if (t.x + t.w < toLineX) { fromCoords = [[t.x + t.w, t.y + t.h/2]]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else {
              joiningCoords = [[t.x + t.w/2, toLineJunction]];
              if (toLineJunction < t.y) { fromCoords = [[t.x + t.w/2, t.y]]; }
              else { fromCoords = [[t.x + t.w/2, t.y + t.h]]; }
            }
          }
          else if (toLineY !== null) {
            // horizontal line
            toPoint[1] = toLineY;
            if (toLineEnds[0] <= t.x + t.w/2 && t.x + t.w/2 <= toLineEnds[1]) {
              toPoint[0] = t.x + t.w/2;
              if (toLineY < t.y) { fromCoords = [[t.x + t.w/2, t.y]]; }
              else if (t.y + t.h < toLineY) { fromCoords = [[t.x + t.w/2, t.y + t.h]]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else if (Math.abs(t.y + t.h/2 - toLineY) > Math.abs(t.x + t.w/2 - toLineJunction)) {
              middle = (toLineY + t.y) / 2;
              joiningCoords = [[t.x + t.w/2, middle], [toLineJunction, middle]];
              if (toLineY < t.y) { fromCoords = [[t.x + t.w/2, t.y]]; }
              else if (t.y + t.h < toLineY) { fromCoords = [[t.x + t.w/2, t.y + t.h]]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else {
              joiningCoords = [[toLineJunction, t.y + t.h/2]];
              if (toLineJunction < t.x) { fromCoords = [[t.x, t.y + t.h/2]]; }
              else { fromCoords = [[t.x + t.w, t.y + t.h/2]]; }
            }
          }
          else {
            throw new Error(`Impossible case: neither horizontal nor vertical line.
             toLineX = ${toLineX}
             toLineY = ${toLineY}`);
          }
          toCoords = [toPoint, toCoords];
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
            else if (Math.abs(t.x + t.w/2 - fromLineX) > Math.abs(t.y + t.h/2 - fromLineJunction)) {
              middle = (fromLineX + t.x) / 2;
              joiningCoords = [[middle, fromLineJunction], [middle, t.y + t.h/2]];
              if (fromLineX < t.x) { toCoords = [[t.x, t.y + t.h/2], [[t.x - d2, t.y + t.h/2 - d2], [t.x - d2, t.y + t.h/2 + d2]]]; }
              else if (t.x + t.w < fromLineX) { toCoords = [[t.x + t.w, t.y + t.h/2], [[t.x + t.w + d2, t.y + t.h/2 - d2], [t.x + t.w + d2, t.y + t.h/2 + d2]]]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else {
              joiningCoords = [[t.x + t.w/2, fromLineJunction]];
              if (fromLineJunction < t.y) { toCoords = [[t.x + t.w/2, t.y], [[t.x + t.w/2 - d2, t.y - d2], [t.x + t.w/2 + d2, t.y - d2]]]; }
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
            else if (Math.abs(t.y + t.h/2 - fromLineY) > Math.abs(t.x + t.w/2 - fromLineJunction)) {
              middle = (fromLineY + t.y) / 2;
              joiningCoords = [[fromLineJunction, middle], [t.x + t.w/2, middle]];
              if (fromLineY < t.y) { toCoords = [[t.x + t.w/2, t.y], [[t.x + t.w/2 - d2, t.y - d2], [t.x + t.w/2 + d2, t.y - d2]]]; }
              else if (t.y + t.h < fromLineY) { toCoords = [[t.x + t.w/2, t.y + t.h], [[t.x + t.w/2 - d2, t.y + t.h + d2], [t.x + t.w/2 + d2, t.y + t.h + d2]]]; }
              else { throw new Error("This shouldn't be happening."); }
            }
            else {
              joiningCoords = [[fromLineJunction, t.y + t.h/2]];
              if (fromLineJunction < t.x) { toCoords = [[t.x, t.y + t.h/2], [[t.x - d2, t.y + t.h/2 - d2], [t.x - d2, t.y + t.h/2 + d2]]]; }
              else { toCoords = [[t.x + t.w, t.y + t.h/2], [[t.x + t.w + d2, t.y + t.h/2 - d2], [t.x + t.w + d2, t.y + t.h/2 + d2]]]; }
            }
          }
          else {
            throw new Error(`Impossible case: neither horizontal nor vertical line.
             fromLineX = ${fromLineX}
             fromLineY = ${fromLineY}`);
          }
          fromCoords = [fromPoint, fromCoords];
        }

        if (!isCoords(fromCoords[0]) || !isCoords(toCoords[0])) {
          throw new Error("fromCoords[0] or toCoords[0] is not of type Coords.");
          // At this point, the first element of fromCoords and toCoords should be of type Coords.
          // This is required by drawAcyclicGraph and also by distInfCoords (Typescript which refuses
          // to compile without this block of code because of the latter).
        }
        if ((joiningCoords.length === 1 || joiningCoords.length === 2) && isCoords(joiningCoords[0])) {
          if (joiningCoords.length === 1) {
            // If the joining branch is in a "L" shape, the delete button will be placed at the middle
            // of the global path and not at the corner of the "L".
            const f = fromCoords[0];
            const j = joiningCoords[0];
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
          else if (isCoords(joiningCoords[1])) { deleteButtonCoords = meanCoords(joiningCoords as Coords[]); }
          else { throw new Error("Cannot place delete button because joiningCoords[1] is not of type Coords."); }
        }
        else if (joiningCoords.length === 0 ) {
          deleteButtonCoords = meanCoords([fromCoords[0], toCoords[0]]);
        }
        else {
          throw new Error("Cannot place delete button because of joiningCoords wrong format.");
        }

        coords = [...fromCoords, ...joiningCoords, ...toCoords];
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

  }
  return [coords, deleteButtonCoords];
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
