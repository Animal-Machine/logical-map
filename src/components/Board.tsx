import { useState, useEffect, useRef } from 'react';
import TileComponent from './Tile';
import ArrowComponent from './Arrow';
import { calculateArrowEnds, drawDoubleArrow } from './arrowFunctions';
import { TileData, TileContent, TileXY, TileZ, Arrow, ArrowCoords, Point, Rectangle } from '../types';

function BoardComponent({ addTile, deleteTile, patchTile, mergeTileData, updateTileTruthValue, updateTileText, tilesContent, tilesXY, setTilesXY, tilesZ, setTilesZ, zMax, setZMax, arrows, setArrows, arrowMode, setArrowMode, addArrow, deleteArrow }: any) {

 
  // Board State

  const initialBoardPosition = [-1920, -1080];
  const initialBoardSize = [3840, 2160];

  const [board, setBoard] = useState({
    x: initialBoardPosition[0],
    y: initialBoardPosition[1],
    w: initialBoardSize[0],
    h: initialBoardSize[1],
  });


  // Dragging

  // Coordinates of the mouse relative to the top-left corner
  // of the dragged element (used in both tile and board dragging):
  let mouseRelToEltX: number;
  let mouseRelToEltY: number;

  // Board dragging

  const startDraggingBoard = (e: any) => {
    // Drag board only with left mouse button if it's the target,
    // or drag board through tile with middle button:
    if ((e.button===0 && e.target.tagName==='CANVAS') || e.button===1) {

      let { x:boardInitialX, y:boardInitialY } = board;
      // Coordsinates of the mouse relative to the top-left corner of the board:
      mouseRelToEltX = e.clientX - boardInitialX;
      mouseRelToEltY = e.clientY - boardInitialY;

      window.addEventListener('mousemove', dragBoard); // enter in "dragging mode"
      window.addEventListener('mouseup', stopDraggingBoard); // trigger to end it
    }
  };

  const dragBoard = (e: MouseEvent) => {
    setBoard(b => ({ ...b,
               x:e.clientX-mouseRelToEltX,
               y:e.clientY-mouseRelToEltY }))
  };

  const stopDraggingBoard = () => {
    window.removeEventListener('mousemove', dragBoard);
    window.removeEventListener('mouseup', stopDraggingBoard);
  };

  // Tile dragging (almost identical to board dragging)

  let movingTileId: number | null = null;

  function startDraggingTile(id: number, mouseX: number, mouseY: number) {
    foreground(id);
    movingTileId = id;

    let [{ x:tileInitialX, y:tileInitialY }]: [{x: number, y:number}]
      = tilesXY.filter((tile:TileXY)=>tile.id===id);
    mouseRelToEltX = mouseX - tileInitialX;
    mouseRelToEltY = mouseY - tileInitialY;

    window.addEventListener('mousemove', dragTile);
    window.addEventListener('mouseup', stopDraggingTile);
  };

  function dragTile(e: MouseEvent) {
    setTilesXY((t: TileXY[]) => t.map((tile: TileXY) =>
      tile.id===movingTileId ? { id: tile.id,
                                 x: e.clientX-mouseRelToEltX,
                                 y: e.clientY-mouseRelToEltY } 
                             : tile
    ));
  };

  function stopDraggingTile(e: MouseEvent) {
    patchTile(movingTileId, {
      x: e.clientX-mouseRelToEltX,
      y: e.clientY-mouseRelToEltY,
      //z: zMax.z // If in the future, there are errors because of too many concurrent patches, this could be a way to fix it. Unfortunately, zMax is sometimes at its current state, sometimes not. A solution could be to make foreground function to return zMax.z
    }).catch((e: Error) => console.error("While setting a tile's new coordinates:", e));
    window.removeEventListener('mousemove', dragTile);
    window.removeEventListener('mouseup', stopDraggingTile);
    movingTileId = null;
  };

  // Bring a tile to the foreground (called by startDraggingTile)

  function foreground(id: number) {
    if (id !== zMax.id) {
      patchTile(id, {z: zMax.z+1})
        .then(() => {
          setTilesZ((t: TileZ[]) => t.map((tile: TileZ) =>
            tile.id===id ? {id: id, z: zMax.z+1} : tile
          ));
        })
        .then(() => setZMax((zMax: TileZ) => ({id: id, z: zMax.z+1})))
        .catch((e: Error) => console.error("While moving a tile to the foreground:", e));
    }
  }


  // Control z and throw error if two tiles have the same

  let [zJustChanged, setZJustChanged] = useState(false);
  useEffect(() => { zJustChanged = true; }, [tilesZ]);

  useEffect(() => { if (zJustChanged) {
    for (let i = 0; i < tilesZ.length; i++) {
      for (let j = 0; j < i; j++) {
        try {
          if (tilesZ[i].z === tilesZ[j].z) {
            throw new Error(`These two tiles have the same z :\n${tilesZ[j].id} "${tilesContent[j].text}" and ${tilesZ[i].id} "${tilesContent[i].text}"`);
          }
        } catch(e) {
          console.error(e)
        }
      }
    }
    setZJustChanged(false);
  }}, [zJustChanged, tilesContent, tilesZ]);


  // Add an empty tile at mouse position

  function addEmptyTile(mouseX: number, mouseY: number) {
    addTile({
      text: '',
      truthValue: null,
      x: mouseX - board.x + initialBoardPosition[0],
      y: mouseY - board.y + initialBoardPosition[1],
    });
  }



  // Arrows drawing


  const tileRefs: any = useRef({}).current;
  const saveTileRef: any = (key: any) => (r: any) => { tileRefs[key] = r };
    // references to the DOM elements related to the Tile components


  /// Update arrows coordinates

  const [arrowsCoords, setArrowsCoords] = useState<ArrowCoords[]>([]);
    // used for drawing and in Arrow.js for the hitbox and the delete button,
    // contains the properties "id" (of the arrow), "coords" (of both ends)
    // and "highlight" (when the cursor is on it)

  useEffect(() => {
    // converts arrows to arrowsCoords
    setArrowsCoords(arrows.map((a: Arrow) => {

      // References to the DOM objects representing the tiles
      let tileFrom = tileRefs[a.from-1];
      let tileTo = tileRefs[a.to-1];

      try {
        let coords = calculateArrowEnds(
          {
            x: tileFrom.offsetLeft,
            y: tileFrom.offsetTop,
            w: tileFrom.offsetWidth,
            h: tileFrom.offsetHeight,
          },
          {
            x: tileTo.offsetLeft,
            y: tileTo.offsetTop,
            w: tileTo.offsetWidth,
            h: tileTo.offsetHeight,
          }
        );

        return {id: a.id, coords: coords, highlight: false};
      }
      catch(err) {console.error(err)}

    // The function will return undefined if the given arrow misses
    // one of its tiles (which can happen when a syncing problem occurs),
    // hence the filter just below which will prevent drawing attempt.

    }).filter((a: ArrowCoords) => a));
  }, [tilesXY, arrows]);


  /// Draw all arrows

  useEffect(() => {

    let stop = false; // used to stop the loop when re-rendering
    let mousePosition: Point = {x: 0, y: 0};
    let mouseTarget: HTMLElement | null;
    const canvas: HTMLCanvasElement | null = document.querySelector('canvas');
    let ctx: CanvasRenderingContext2D | null;
    if (canvas) {
      // canvas is not supported by some browsers
      ctx = canvas.getContext('2d');
      if (ctx) {
        if (arrowMode) {
          window.addEventListener('mousemove', updateMousePosition);
            // window, NOT canvas: else the target will always be the canvas
          if (arrowMode !== true) {
            // see state declaration to understand arrowMode
            window.addEventListener('click', onClickPlaceArrow);
          }
        }
        loop(ctx);
      }
    }

    function onClickPlaceArrow(e: any) {
    // function to place the arrow and exit arrow mode if the user clicks on a tile
      if (e.target.tagName === "TEXTAREA") {
        const targetTileId = parseInt(Object.keys(tileRefs).filter(key => (tileRefs[key] === e.target))[0]) + 1;
        if (targetTileId !== arrowMode) {
          addArrow(arrowMode, targetTileId); // also sets arrowMode to false
        }
      }
    }

    function updateMousePosition(event: MouseEvent) {
      // used in arrow mode, to detect when the user clicks on a tile and update the tip of the arrow
      mousePosition.x = event.clientX;
      mousePosition.y = event.clientY;
      mouseTarget = event.target as HTMLElement;
    }

    function loop(ctx: CanvasRenderingContext2D) {
      // animation loop which draws on the canvas context
      ctx.clearRect(0, 0, board.w, board.h);
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      for (let i in arrowsCoords) {
        if (arrowsCoords[i].coords) {
          drawDoubleArrow(ctx, arrowsCoords[i].coords)
          if (arrowsCoords[i].highlight) {drawDoubleArrow(ctx, arrowsCoords[i].coords)}
        }
      }
      if (typeof arrowMode === "number" && mouseTarget) {
        // mouseTarget is important here because when arrowMode just changed,
        // the event handler updateMousePosition has just been placed and didn't run,
        // so mousePosition and mouseTarget have their default value
        let tileFrom = tileRefs[arrowMode-1];
        drawDoubleArrow(ctx, calculateArrowEnds(
          {
            x: tileFrom.offsetLeft,
            y: tileFrom.offsetTop,
            w: tileFrom.offsetWidth,
            h: tileFrom.offsetHeight,
          },
          getArrowTip(),
        ));
      }
      ctx.stroke();
      ctx.closePath();
      if (stop) { return; }
      else { window.requestAnimationFrame(() => loop(ctx)); }
    }

    function getArrowTip(): Point | Rectangle {
      // function giving the arrow tip, active when the user must choose a second tile
      let arrowTip: Point | Rectangle = {x: 1000, y: 1000}; // TODO find a better initial value?
      if (Object.keys(tileRefs).filter(key => (tileRefs[key] === mouseTarget)).length === 0)
        // if no tile is targeted, arrowTip takes the mouse coordinates:
      {
        arrowTip = {
          x: mousePosition.x - board.x,
          y: mousePosition.y - board.y,
        };
      }
      else if (mouseTarget)
        // if there is one, arrowTip takes its coordinates, width and height
      {
        arrowTip = {
          x: mouseTarget.offsetLeft,
          y: mouseTarget.offsetTop,
          w: mouseTarget.offsetWidth,
          h: mouseTarget.offsetHeight,
        };
      };
      return arrowTip;
    }

    return () => {
      stop = true;
      if (arrowMode && canvas) {
        window.removeEventListener('mousemove', updateMousePosition);
        if (arrowMode !== true) {
          window.removeEventListener('click', onClickPlaceArrow);
        }
      }
    };
  }, [arrowsCoords, arrowMode, board]);


  // Highlight arrow when cursor is on it

  function switchHighlight(id: number, value: boolean) {
    setArrowsCoords((arrowsCoords: ArrowCoords[]) => arrowsCoords.map((a: ArrowCoords) => (a.id === id) ? {...a, highlight: value} : a ));
  }


  // Render

  return (
    <div
      className = {"Board" + (arrowMode ? " ArrowMode" : "")}
      style = {{ left:board.x, top:board.y, width:board.w, height:board.h }}
      onMouseDown = {e => startDraggingBoard(e)}
      onDoubleClick = {e => {
        if (!arrowMode) {addEmptyTile(e.clientX, e.clientY)}
      }}
    >
      <canvas width={board.w} height={board.h}>{/*Insérer des éléments pour remplacer les flèches*/}</canvas>
      {arrowsCoords.map(a =>
        <ArrowComponent
          key={a.id}
          arrow={a}
          switchHighlight={switchHighlight}
          deleteArrow={deleteArrow}
        />
      )}
      {mergeTileData(tilesContent, tilesXY, tilesZ).map((tile: TileData) =>
        <TileComponent
          key={tile.id}
          ref={saveTileRef(tile.id-1)} // I don't know how useRef() usually works but ref={tileRefs[tileContent.id-1]} doesn't.
          tile={tile}
          deleteTile={deleteTile}
          startDragging={startDraggingTile}
          updateTruthValue={updateTileTruthValue}
          updateText={updateTileText}
          arrowMode={arrowMode}
          setArrowMode={setArrowMode}
        />
      )}
    </div>
  );
}

export default BoardComponent;
