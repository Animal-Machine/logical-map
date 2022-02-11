import { useState, useEffect, useRef } from 'react';
import TileComponent from './Tile';
import ArrowComponent from './Arrow';
import { calculateArrowCoords, drawArrow, drawAcyclicGraph } from './arrowFunctions';
import { TileData, TileContent, TileXY, TileZ, Arrow, Mode, TileSelection } from '../types';
import { Point, Rectangle, ArrowCoords, Coords, DoubleCoords, CoordsOrArray } from '../coordTypes';

//function BoardComponent({ addTile, deleteTile, patchTile, mergeTileData, updateTileTruthValue, updateTileText, tilesContent, tilesXY, setTilesXY, tilesZ, setTilesZ, zMax, setZMax, arrows, setArrows, modeState, setModeState, tileSelection, setTileSelection, addArrow, deleteArrow }: any) {
function BoardComponent(props: any) {

  const addTile = props.addTile;
  const deleteTile = props.deleteTile;
  const patchTile = props.patchTile;
  const mergeTileData = props.mergeTileData;
  const updateTileTruthValue = props.updateTileTruthValue;
  const updateTileText = props.updateTileText;
  const tilesContent = props.tilesContent;
  const tilesXY = props.tilesXY;
  const setTilesXY = props.setTilesXY;
  const tilesZ = props.tilesZ;
  const setTilesZ = props.setTilesZ;
  const zMax = props.zMax;
  const setZMax = props.setZMax;
  const arrows = props.arrows;
  const setArrows = props.setArrows;
  const modeState: Mode = props.modeState;
  const setModeState: (m: Mode) => Mode = props.setModeState;
  const tileSelection: TileSelection = props.tileSelection;
  const setTileSelection: (ts: TileSelection) => TileSelection = props.setTileSelection;
  const addArrow = props.addArrow;
  const deleteArrow = props.deleteArrow;


 
  // Board State

  const initialBoardCoords = {
    x: -1920,
    y: -1080,
    w: 3840,
    h: 2160,
  };

  const [board, setBoard] = useState(initialBoardCoords);

  const [origin, setOrigin] = useState([-initialBoardCoords.x, -initialBoardCoords.y]);
    // I want 0, 0 to be at the center of my board.
    // These "origin" coordinates are therefore added to all tiles coordinates.


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
      x: mouseX - board.x - origin[0],
      y: mouseY - board.y - origin[1],
    });
  }



  //// Arrows drawing


  interface TextAreaDictionary {
    [index: number]: HTMLTextAreaElement;
  }
  const tileRefs = useRef<TextAreaDictionary>({}).current;
  const saveTileRef = (key: number) => (r: HTMLTextAreaElement) => { tileRefs[key] = r };
    // references to the DOM elements related to the Tile components

  function tileIdToRectangle(id: number): Rectangle {
    // returns the coordinates and size of the tile whose ID is given
    let tRef = tileRefs[id-1];
    return {
      x: tRef.offsetLeft,
      y: tRef.offsetTop,
      w: tRef.offsetWidth,
      h: tRef.offsetHeight,
    };
  }


  /// Update arrows coordinates

  const [arrowsCoords, setArrowsCoords] = useState<ArrowCoords[]>([]);
    // used for drawing and in Arrow.js for the hitbox and the delete button,
    // contains the properties "id" (of the arrow), "coords" (of both ends)
    // and "highlight" (when the cursor is on it)

  useEffect(() => {
    // converts arrows to arrowsCoords
    setArrowsCoords(arrows.map((a: Arrow) => {

      // References to the DOM objects representing the tiles
      let tilesFromRefs = a.tilesFrom.map(t => tileRefs[t-1]);
      let tilesToRefs = a.tilesTo.map(t => tileRefs[t-1]);

      let tilesFrom: Rectangle[] = [];
      let tilesTo: Rectangle[] = [];

      try {
        for (let tRef of tilesFromRefs) {
          tilesFrom.push({
            x: tRef.offsetLeft,
            y: tRef.offsetTop,
            w: tRef.offsetWidth,
            h: tRef.offsetHeight,
          });
        }
        for (let tRef of tilesToRefs) {
          tilesTo.push({
            x: tRef.offsetLeft,
            y: tRef.offsetTop,
            w: tRef.offsetWidth,
            h: tRef.offsetHeight,
          });
        }

        let coords: DoubleCoords | CoordsOrArray[] = calculateArrowCoords({tilesFrom: tilesFrom, tilesTo: tilesTo});

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
      // canvas is not supported by some browsers and can be null
      ctx = canvas.getContext('2d');
      if (ctx) {
        if (modeState !== 'default') {
          window.addEventListener('mousemove', updateMousePosition);
            // window, NOT canvas: else the target will always be the canvas
        }
        loop(ctx);
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
          drawArrow(ctx, arrowsCoords[i].coords)
          if (arrowsCoords[i].highlight) {drawArrow(ctx, arrowsCoords[i].coords)}
        }
      }
      if (['singleArrow', 'branchedArrow1', 'branchedArrow2'].includes(modeState) && tileSelection.tilesFrom.length > 0 && mouseTarget) {
        // mouseTarget is important here because when tileSelection just changed,
        // the event handler updateMousePosition has just been placed and didn't run,
        // so mousePosition and mouseTarget have their default value. So it's better
        // not to draw the arrow being placed.
        let tFrom = tileSelection.tilesFrom.map(tileIdToRectangle);
        let tTo = tileSelection.tilesTo.map(tileIdToRectangle);
        if (modeState === 'branchedArrow1') {
          tFrom.push(getArrowTip());
        } else {
          tTo.push(getArrowTip());
        }
        drawArrow(ctx, calculateArrowCoords({
          tilesFrom: tFrom,
          tilesTo: tTo,
        }));
      }
      ctx.stroke();
      ctx.closePath();
      if (stop) { return; }
      else { window.requestAnimationFrame(() => loop(ctx)); }
    }

    function getArrowTip(): Rectangle {
      // function giving the arrow tip, active when the user must choose a second tile
      let arrowTip = new Rectangle();
      if (Object.keys(tileRefs).filter((key: any) => (tileRefs[key] === mouseTarget)).length === 0) {
        // if no tile is targeted, arrowTip takes the mouse coordinates:
        arrowTip.x = mousePosition.x - board.x;
        arrowTip.y = mousePosition.y - board.y;
      } else if (mouseTarget) {
        // if there is one, arrowTip takes its coordinates, width and height
        arrowTip = {
          x: mouseTarget.offsetLeft,
          y: mouseTarget.offsetTop,
          w: mouseTarget.offsetWidth,
          h: mouseTarget.offsetHeight,
        };
      }
      else {
        throw new Error("Arrow seems to point nowhere.");
        arrowTip = {x:0, y:0, w:0, h:0};
      }
      return arrowTip;
    }

    return () => {
      stop = true;
      if (modeState !== 'default' && canvas) {
        window.removeEventListener('mousemove', updateMousePosition);
      }
    };
  }, [arrowsCoords, modeState, tileSelection, board]);


  // Highlight arrow when cursor is on it

  function switchHighlight(id: number, value: boolean) {
    setArrowsCoords((arrowsCoords: ArrowCoords[]) => arrowsCoords.map((a: ArrowCoords) => (a.id === id) ? {...a, highlight: value} : a ));
  }



  return (
    <div
      className = {"Board" + (modeState !== 'default' ? " ArrowMode" : "")}
      style = {{ left:board.x, top:board.y, width:board.w, height:board.h }}
      onMouseDown = {e => startDraggingBoard(e)}
      onDoubleClick = {e => {
        if (modeState === 'default') {addEmptyTile(e.clientX, e.clientY)}
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
          origin={origin}
          tile={tile}
          deleteTile={deleteTile}
          startDragging={startDraggingTile}
          updateTruthValue={updateTileTruthValue}
          updateText={updateTileText}
          modeState={modeState}
          setModeState={setModeState}
          tileSelection={tileSelection}
          setTileSelection={setTileSelection}
          addArrow={addArrow}
        />
      )}
    </div>
  );
}

export default BoardComponent;
