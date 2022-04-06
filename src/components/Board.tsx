import { useState, useEffect, useRef } from 'react';
import TileComponent from './Tile';
import ArrowComponent from './Arrow';
import { calculateArrowCoords, drawAcyclicGraph, isOnGraph } from './arrowFunctions';
import { TileXY, TileZ, TileContent, TileDataPart, TileData, TileSelection } from '../types/tiles';
import { Operator, Arrow, AddArrow, Mode, ArrowCoords, ArrowHighlight, HighlightMethod } from '../types/arrows';
import { Point, Rectangle, Coords, DoubleCoords, CoordsOrArray } from '../types/graphDrawing';


function BoardComponent(props: any) {

  const addTile:                  (tile: TileDataPart) => void
    = props.addTile;
  const deleteTile:               (id: number) => void
    = props.deleteTile;
  const patchTile:                (id: number, updatedProperties: object) => Promise<Response>
    = props.patchTile;
  const mergeTileData:            (TContent: TileContent[], TXY: TileXY[], TZ: TileZ[]) => TileData[]
    = props.mergeTileData;
  const updateTileTruthValue:     (id: number, value: boolean|null) => void
    = props.updateTileTruthValue;
  const updateTileText:           (id: number, text: string) => void
    = props.updateTileText;
  const tilesContent:             TileContent[]
    = props.tilesContent;
  const tilesXY:                  TileXY[]
    = props.tilesXY;
  const setTilesXY:               React.Dispatch<React.SetStateAction<TileXY[]>>
    = props.setTilesXY;
  const tilesZ:                   TileZ[]
    = props.tilesZ;
  const setTilesZ:                React.Dispatch<React.SetStateAction<TileZ[]>>
    = props.setTilesZ;
  const zMax:                     TileZ
    = props.zMax;
  const setZMax:                  React.Dispatch<React.SetStateAction<TileZ>>
    = props.setZMax;
  const arrows:                   Arrow[]
    = props.arrows;
  const setArrows:                React.Dispatch<React.SetStateAction<Arrow[]>>
    = props.setArrows;
  const modeState:                Mode
    = props.modeState;
  const setModeState:             React.Dispatch<React.SetStateAction<Mode>>
    = props.setModeState;
  const tileSelection:            TileSelection
    = props.tileSelection;
  const setTileSelection:         React.Dispatch<React.SetStateAction<TileSelection>>
    = props.setTileSelection;
  const addArrow:                 AddArrow
    = props.addArrow;
  const deleteArrow:              (id: number) => void
    = props.deleteArrow;


 
  // Mouse States

  const [mousePosition, setMousePosition] = useState<Point>({x: 0, y: 0});
    // used for arrow highlighting and arrow tip drawing in arrow mode
  const [mouseTarget, setMouseTarget] = useState<HTMLElement|null>(null);
    // used for arrow tip drawing in arrow mode

  useEffect(() => {
    function updateMousePosition(event: MouseEvent) {
      setMousePosition({x: event.clientX, y: event.clientY});
      setMouseTarget(event.target as HTMLElement);
    }
    window.addEventListener('mousemove', updateMousePosition);

    return () => { window.removeEventListener('mousemove', updateMousePosition); };
  }, []);


  // Board State

  const initialBoardCoords = {
    x: -1920,
    y: -1080,
    w: 3840,
    h: 2160,
  };

  const [board, setBoard] = useState<Rectangle>(initialBoardCoords);

  const [origin, setOrigin] = useState<Coords>([-initialBoardCoords.x, -initialBoardCoords.y]);
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

    let [{ x:tileInitialX, y:tileInitialY }]: TileXY[]
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
    patchTile(movingTileId!, {
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

  const [zJustChanged, setZJustChanged] = useState(false);
  useEffect(() => { setZJustChanged(true); }, [tilesZ]);

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
    // used for drawing and in Arrow.tsx for the delete button,
    // contains the properties "id" (of the arrow), "coords" (of both ends)
  const [arrowsHighlight, setArrowsHighlight] = useState<ArrowHighlight[]>([]);
    // contains the properties "id" (of the arrow), "highlightedByDrawing" (when the cursor hovers over the arrow itself)
    // and "highlightedByButton" (when the cursor hovers over a button associated with this arrow)

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

        let [coords, deleteButtonCoords]: [DoubleCoords | CoordsOrArray[], Coords] = calculateArrowCoords({tilesFrom: tilesFrom, tilesTo: tilesTo});

        return {id: a.id, coords: coords, deleteButtonCoords: deleteButtonCoords};
      }
      catch(err) {console.error(err)}

    // The function will return undefined if the given arrow misses
    // one of its tiles (which can happen when a syncing problem occurs),
    // hence the filter just below which will prevent drawing attempt.

    }).filter((a: ArrowCoords | undefined) => a) as ArrowCoords[]);
  }, [tilesXY, arrows]);

  useEffect(() => {
    // converts arrows to arrowsHighlight
    setArrowsHighlight(arrows.map((a: Arrow) => ({id: a.id, highlightedByDrawing: false, highlightedByButton: false})));
  }, [arrows]);

  /// Draw all arrows

  useEffect(() => {

    const canvas: HTMLCanvasElement | null = document.querySelector('canvas');
    let ctx: CanvasRenderingContext2D | null;

    if (canvas) {
      // canvas is not supported by some browsers and can be null
      ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, board.w, board.h);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0,0,0,.5)';
        for (let i in arrowsCoords) {
          if (arrowsCoords[i].coords) {
            switchHighlight(arrowsCoords[i].id, isOnGraph([mousePosition.x - board.x, mousePosition.y - board.y], arrowsCoords[i].coords), "drawing");
            if (arrowsHighlight[i].highlightedByDrawing || arrowsHighlight[i].highlightedByButton) {
              ctx.shadowColor = 'rgba(255,255,255,.5)';
            }
            drawAcyclicGraph(ctx, arrowsCoords[i].coords)
            ctx.shadowColor = 'rgba(0,0,0,.5)';
          }
        }
        if (['singleArrow', 'branchedArrow1', 'branchedArrow2'].includes(modeState) && tileSelection.tilesFrom.length > 0) {
          let tFrom = tileSelection.tilesFrom.map(tileIdToRectangle);
          let tTo = tileSelection.tilesTo.map(tileIdToRectangle);
          let tAll = tileSelection.tilesFrom.concat(tileSelection.tilesTo);
          if (modeState === 'branchedArrow1') {
            tFrom.push(getArrowTip(tAll));
          } else {
            tTo.push(getArrowTip(tAll));
          }
          drawAcyclicGraph(ctx, calculateArrowCoords({
            tilesFrom: tFrom,
            tilesTo: tTo,
          })[0]);
        }
      }
    }

    function getArrowTip(unselectableTiles: number[]): Rectangle {
      // function giving the arrow tip, active when the user must choose a second tile
      let arrowTip = new Rectangle();
      if (Object.keys(tileRefs).filter((key: string) => (!(unselectableTiles.includes(Number(key) + 1)) && tileRefs[Number(key)] === mouseTarget)).length === 0) {
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
    };
  }, [mousePosition, board, arrowsCoords, modeState, tileSelection]);


  // Highlight arrow when the mouse hovers over it or its button

  function switchHighlight(id: number, value: boolean, method: HighlightMethod) {
    setArrowsHighlight((arrowsHighlight: ArrowHighlight[]) => arrowsHighlight.map((a: ArrowHighlight) =>
      a.id === id ? (method === "drawing" ? {...a, highlightedByDrawing: value} : {...a, highlightedByButton: value}) : a ));
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
          arrow={{...a, ...arrowsHighlight.filter((aH: ArrowHighlight) => aH.id === a.id)[0]}}
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
