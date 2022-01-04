import { useState, useEffect, useRef } from 'react'
import Tile from './Tile'
import Arrow from './Arrow'
import { calculateArrowEnds, drawDoubleArrow } from './arrowFunctions.js'

function Board({ myGet, myPost, tilesContent, setTilesContent, tilesCoords, setTilesCoords, setTiles, arrows, setArrows, arrowMode, setArrowMode, addArrow, deleteArrow }) {

 
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
  let mouseRelToEltX;
  let mouseRelToEltY;

  // Board dragging

  const startDraggingBoard = e => {
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

  const dragBoard = e => {
    setBoard(b => ({ ...b,
               x:e.clientX-mouseRelToEltX,
               y:e.clientY-mouseRelToEltY }))
  };

  const stopDraggingBoard = () => {
    window.removeEventListener('mousemove', dragBoard);
    window.removeEventListener('mouseup', stopDraggingBoard);
  };

  // Tile dragging (almost identical to board dragging)

  let movingTileId = null;

  function startDraggingTile(id, mouseX, mouseY) {
    foreground(id);
    movingTileId = id;

    let [{x:tileInitialX, y:tileInitialY}] = tilesCoords.filter(tile=>tile.id===id);
    mouseRelToEltX = mouseX - tileInitialX;
    mouseRelToEltY = mouseY - tileInitialY;

    window.addEventListener('mousemove', dragTile);
    window.addEventListener('mouseup', stopDraggingTile);
  };

  function dragTile(e) {
    setTilesCoords(t => t.map(tile =>
      tile.id===movingTileId ? { ...tile,
                                 x: e.clientX-mouseRelToEltX,
                                 y: e.clientY-mouseRelToEltY } 
                             : tile
    ));
  };

  function stopDraggingTile(e) {
    fetch(`http://localhost:5000/tiles/${movingTileId}`, {
      method: 'PATCH',
      headers: {'Content-type': 'application/json'},
      body: JSON.stringify({x: e.clientX-mouseRelToEltX,
                            y: e.clientY-mouseRelToEltY}), 
    });
    window.removeEventListener('mousemove', dragTile);
    window.removeEventListener('mouseup', stopDraggingTile);
    movingTileId = null;
  };

  // Bring tile to the foreground (called by startDraggingTile)
    // TODO: optimization (fetch and update state in the same conditional statements? Only fetch sometimes?)

  function foreground(id) {
    let [{z:initialZ}] = tilesCoords.filter(tile=>tile.id===id)

    if (initialZ !== tilesCoords.length) {
      tilesCoords.forEach(tile => {
        if (tile.id === id) {
          fetch(`http://localhost:5000/tiles/${id}`, {
            method: 'PATCH',
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({z: tilesCoords.length}),
          });
        } else if (tile.z > initialZ){
          fetch(`http://localhost:5000/tiles/${tile.id}`, {
            method: 'PATCH',
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({z: tile.z-1}),
          });
        }
      });

      setTilesCoords(t => t.map(tile =>
        tile.id===id ? {...tile, z:t.length}
                     : tile.z<initialZ ? tile
                                       : {...tile, z:tile.z-1}
      ));
    }
  }

  // Control z and throw error if two tiles have the same
  // TODO: less often for performance

  useEffect(() => {
    for (let i in tilesCoords) {
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
  }, [tilesCoords]);


  // Add a new tile

  function addTile(mouseX, mouseY) {
    myPost("tiles", {
      text: '',
      truthValue: null,
      x: mouseX - board.x + initialBoardPosition[0],
      y: mouseY - board.y + initialBoardPosition[1],
      z: tilesCoords.length + 1,
    }).then(() => myGet("tiles"))
        // I need to get the id of the new tile to place arrow, hence this fetch GET
        // Note: it isn't .then(myGet("tiles")) because .then needs a function, not a promise
      .then(setTiles)
      .catch(e => console.error("While adding a new tile, ", e));
  }


  // Delete a tile
  
  function deleteTile(id) {
    // deletes arrows tied to the tile first, then the tile itself.

    (async function() {
      let arrowList = [];
      // Tried this:
      //await Promise.all(arrows.map(a => async () => {
      // which didn't work. Why?
      // TODO UNDERSTAND
      // And I didn't understand either the solution I found on the web:
      await Promise.all(arrows.map(async (a) => {
        if (a.from === id || a.to === id) {
          await fetch(`http://localhost:5000/arrows/${a.id}`, {method: 'DELETE',});
          arrowList.push(a.id);
        }
      }));
      return(arrowList);
    })()

      .then(resp => setArrows(arrows => arrows.filter(a => !resp.includes(a.id))))
      .then(() => fetch(`http://localhost:5000/tiles/${id}`, {method: 'DELETE',}))
      .then(() => setTilesContent(t => t.filter(tile => tile.id !== id)))
      .then(() => setTilesCoords(t => t.filter(tile => tile.id !== id)))
      .catch(e => console.error("While deleting arrows, ", e));
  }


  // Change a tile's truth value

  function updateTruthValue(id, value) {
    fetch(`http://localhost:5000/tiles/${id}`, {
      method: 'PATCH',
      headers: {'Content-type': 'application/json'},
      body: JSON.stringify({truthValue: value}),
    });

    setTilesContent(t => t.map(tile =>
      tile.id===id ? {...tile, truthValue: value} : tile
    ));
  }


  // Update text input by user

  function updateText(id, text) {
    setTilesContent(t => t.map(tile =>
      tile.id===id ? {...tile, text:text} : tile
    ));

    // Est-ce que ce n'est pas trop gourmand d'envoyer une requête à chaque caractère ajouté ou supprimé ? TODO à réfléchir
    fetch(`http://localhost:5000/tiles/${id}`, {
      method: 'PATCH',
      headers: {'Content-type': 'application/json'},
      body: JSON.stringify({text: text}),
    });
  }

  

  // Arrows drawing


  const tileRefs = useRef({}).current
  const saveTileRef = key => r => { tileRefs[key] = r }
    // references to the DOM elements related to the Tile components


  /// Update arrows coordinates

  const [arrowsCoords, setArrowsCoords] = useState([]);
    // used for drawing and in Arrow.js for the hitbox and the delete button,
    // contains the properties "id" (of the arrow), "coords" (of both ends)
    // and "highlight" (when the cursor is on it)

  useEffect(() => {
    setArrowsCoords(arrows.map(a => {

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
            X: tileTo.offsetLeft,
            Y: tileTo.offsetTop,
            W: tileTo.offsetWidth,
            H: tileTo.offsetHeight,
          }
        );

        return {id: a.id, coords: coords, highlight: false};
      }
      catch(err) {console.log(err)}

    // The function will return undefined if the given arrow misses
    // one of its tiles (which can happen when a syncing problem occurs),
    // hence the filter just below which will prevent drawing attempt.

    }).filter(a => a));
  }, [tilesCoords, arrows]);


  /// Update coordinates of the arrow being placed in arrow mode, and place the arrow

  const [arrowTip, setArrowTip] = useState({}); // TODO find a better initial value?
    // state used in arrow mode, represents the coordinates of the arrow tip

  useEffect(() => {

    // Function to update the arrow tip, active when the user must choose a second tile:
    function updateArrowTip(e) {
      if (Object.keys(tileRefs).filter(key => (tileRefs[key] === e.target)).length === 0)
      {
        setArrowTip({
          X: e.clientX - board.x,
          Y: e.clientY - board.y,
        });
      }
      else
      {
        setArrowTip({
          X: e.target.offsetLeft,
          Y: e.target.offsetTop,
          W: e.target.offsetWidth,
          H: e.target.offsetHeight,
        });
      }
    }

    // Function to place the arrow and exit arrow mode if the user clicks on a tile:
    function onClick(e) {
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
    if (canvas.getContext) {
      let ctx = canvas.getContext('2d');
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
    } //else: si canvas n'est pas supporté
  }, [arrowsCoords, arrowMode, arrowTip]);


  // Highlight arrow when cursor is on it

  function switchHighlight(id, value) {
    setArrowsCoords(arrowsCoords => arrowsCoords.map(c => (c.id === id) ? {...c, highlight: value} : c ));
  }


  // Render

  return (
    <div
      className = {"Board" + (arrowMode ? " ArrowMode" : "")}
      style = {{ left:board.x, top:board.y, width:board.w, height:board.h }}
      onMouseDown = {e => startDraggingBoard(e)}
      onDoubleClick = {e => {
        if (!arrowMode) {addTile(e.clientX, e.clientY)}
      }}
    >
      <canvas width={board.w} height={board.h}>{/*Insérer des éléments pour remplacer les flèches*/}</canvas>
      {arrowsCoords.map(a =>
        <Arrow
          key={a.id}
          arrow={a}
          switchHighlight={switchHighlight}
          deleteArrow={deleteArrow}
        />
      )}
      {tilesContent.map(tileContent =>
        <Tile
          key={tileContent.id}
          ref={saveTileRef(tileContent.id-1)} // I don't know how useRef() usually works but ref={tileRefs[tileContent.id-1]} doesn't.
          tile={{...tileContent, ...tilesCoords.filter(t => t.id===tileContent.id)[0]}}
          deleteTile={deleteTile}
          updateTruthValue={updateTruthValue}
          startDraggingTile={startDraggingTile}
          updateText={updateText}
          arrowMode={arrowMode}
          setArrowMode={setArrowMode}
        />
      )}
    </div>
  );
}

export default Board
