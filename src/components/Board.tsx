import { useState, useEffect, useRef } from 'react';
import TileComponent from './Tile';
import ArrowComponent from './Arrow';
import { calculateArrowEnds, drawDoubleArrow } from './arrowFunctions';
import { TileData, TileContent, TileCoords, Arrow, ArrowCoords, Point, Rectangle } from '../types';

function BoardComponent({ addTile, deleteTile, patchTile, updateTileTruthValue, updateTileText, tilesContent, tilesCoords, setTilesCoords, arrows, setArrows, arrowMode, setArrowMode, addArrow, deleteArrow }: any) {

 
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

  // Coordsinates of the mouse relative to the top-left corner
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

    let [{x:tileInitialX, y:tileInitialY}]: [{x: number, y:number}] = tilesCoords.filter((tile:TileData)=>tile.id===id);
    mouseRelToEltX = mouseX - tileInitialX;
    mouseRelToEltY = mouseY - tileInitialY;

    window.addEventListener('mousemove', dragTile);
    window.addEventListener('mouseup', stopDraggingTile);
  };

  function dragTile(e: MouseEvent) {
    setTilesCoords((t: TileCoords[]) => t.map((tile: TileCoords) =>
      tile.id===movingTileId ? { ...tile,
                                 x: e.clientX-mouseRelToEltX,
                                 y: e.clientY-mouseRelToEltY } 
                             : tile
    ));
  };

  function stopDraggingTile(e: MouseEvent) {
    patchTile(movingTileId, {
      x: e.clientX-mouseRelToEltX,
      y: e.clientY-mouseRelToEltY
    }).catch((e: Error) => console.error("While setting a tile's new coordinates:", e));
    window.removeEventListener('mousemove', dragTile);
    window.removeEventListener('mouseup', stopDraggingTile);
    movingTileId = null;
  };

  // Bring tile to the foreground (called by startDraggingTile)
    // TODO: optimization (patchTile and update tilesCoord state in the same conditional statements? Only patch sometimes?)

  function foreground(id: number) {
    let [{z:initialZ}]: [{z:number}] = tilesCoords.filter((tile: TileCoords) => tile.id===id)

    if (initialZ !== tilesCoords.length) {
      patchTile(id, {z: tilesCoords.length})
        .catch((e: Error) => console.error("While moving a tile to the foreground:", e));
      tilesCoords.forEach((tile: TileCoords) => {
        if (tile.z > initialZ){
          patchTile(tile.id, {z: tile.z-1})
            .catch((e: Error) => console.error("While moving a tile one step to the back:", e));
        }
      });

      setTilesCoords((t: TileCoords[]) => t.map((tile: TileCoords) =>
        tile.id===id ? {...tile, z:t.length}
                     : tile.z<initialZ ? tile
                                       : {...tile, z:tile.z-1}
      ));
    }
  }

  // Control z and throw error if two tiles have the same
  // TODO: less often for performance

  useEffect(() => {
    for (let i = 0; i < tilesCoords.length; i++) {
      for (let j = 0; j < i; j++) {
        try {
          if (tilesCoords[i].z === tilesCoords[j].z) {
            throw new Error(`These two tiles have the same z :\n${tilesCoords[j].id} "${tilesContent[j].text}" and ${tilesCoords[i].id} "${tilesContent[i].text}"`);
          }
        } catch(e) {
          console.error(e)
        }
      }
    }
  }, [tilesContent]);


  // Add an empty tile at mouse position

  function addEmptyTile(mouseX: number, mouseY: number) {
    addTile({
      text: '',
      truthValue: null,
      x: mouseX - board.x + initialBoardPosition[0],
      y: mouseY - board.y + initialBoardPosition[1],
      z: tilesCoords.length + 1,
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
      catch(err) {console.log(err)}

    // The function will return undefined if the given arrow misses
    // one of its tiles (which can happen when a syncing problem occurs),
    // hence the filter just below which will prevent drawing attempt.

    }).filter((a: ArrowCoords) => a));
  }, [tilesCoords, arrows]);


  /// Update coordinates of the arrow being placed in arrow mode, and place the arrow

  const [arrowTip, setArrowTip] = useState<Point | Rectangle>({x: 0, y: 0}); // TODO find a better initial value?
    // state used in arrow mode, represents the coordinates of the arrow tip

  useEffect(() => {

    // Function to update the arrow tip, active when the user must choose a second tile:
    function updateArrowTip(e: any) {
      if (Object.keys(tileRefs).filter(key => (tileRefs[key] === e.target)).length === 0)
        // if no tile is targeted, arrowTip takes the mouse coordinates:
      {
        setArrowTip({
          x: e.clientX - board.x,
          y: e.clientY - board.y,
        });
      }
      else
        // if there is one, arrowTip takes its coordinates, width and height
      {
        setArrowTip({
          x: e.target.offsetLeft,
          y: e.target.offsetTop,
          w: e.target.offsetWidth,
          h: e.target.offsetHeight,
        });
      }
    }

    // Function to place the arrow and exit arrow mode if the user clicks on a tile:
    function onClick(e: any) {
      if (e.target.tagName === "TEXTAREA") {
        const targetTileId = parseInt(Object.keys(tileRefs).filter(key => (tileRefs[key] === e.target))[0]) + 1;
        if (targetTileId !== arrowMode) {
          addArrow(arrowMode, targetTileId);
        }
      }
    }

    if (typeof arrowMode !== "boolean") {
      window.addEventListener('mousemove', updateArrowTip);
      window.addEventListener('click', onClick);
    }
    return () => {
      window.removeEventListener('mousemove', updateArrowTip)
      window.removeEventListener('click', onClick);
    };
  }, [arrowMode, board]);
  // board is in the dependency array to get the updated value in updateArrowTip scope


  /// Draw all arrows

  useEffect(() => {
    let canvas = document.querySelector('canvas');
    if (canvas) {
      let ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, board.w, board.h);
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        for (let i in arrowsCoords) {
          if (arrowsCoords[i].coords) {
            drawDoubleArrow(ctx, arrowsCoords[i].coords)
            if (arrowsCoords[i].highlight) {drawDoubleArrow(ctx, arrowsCoords[i].coords)}
          }
        }
        if (typeof arrowMode !== "boolean") {
          let tileFrom = tileRefs[arrowMode-1];
          drawDoubleArrow(ctx, calculateArrowEnds(
            {
              x: tileFrom.offsetLeft,
              y: tileFrom.offsetTop,
              w: tileFrom.offsetWidth,
              h: tileFrom.offsetHeight,
            },
            arrowTip
          ));
        }
        ctx.stroke();
        ctx.closePath();
      }
    } //else: si canvas n'est pas supporté
  }, [arrowsCoords, arrowMode, arrowTip]);


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
      {tilesContent.map((tileContent: TileContent) =>
        <TileComponent
          key={tileContent.id}
          ref={saveTileRef(tileContent.id-1)} // I don't know how useRef() usually works but ref={tileRefs[tileContent.id-1]} doesn't.
          tile={{...tileContent, ...tilesCoords.filter((t: TileCoords) => t.id===tileContent.id)[0]}}
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
