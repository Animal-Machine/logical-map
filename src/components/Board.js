import { useState, useEffect, useRef } from 'react'
import Tile from './Tile'
import Arrow from './Arrow'
import { drawDoubleArrow } from './drawArrow.js'

function Board({ tiles, setTiles, fetchTiles, arrows, arrowMode, setArrowMode }) {
 
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
  let mouseRelToEltX;
  let mouseRelToEltY;

  // Board dragging

  const startDraggingBoard = e => {
    // Drag board only with left mouse button if it's the target,
    // or drag board through tile with middle button:
    if ((e.button===0 && e.target.tagName==='CANVAS') || e.button===1) {

      let { x:boardInitialX, y:boardInitialY } = board;
      // Coordinates of the mouse relative to the top-left corner of the board:
      mouseRelToEltX = e.clientX - boardInitialX;
      mouseRelToEltY = e.clientY - boardInitialY;

      window.addEventListener('mousemove', dragBoard); // enter in "dragging mode"
      window.addEventListener('mouseup', stopDraggingBoard); // trigger to end it
    }
  };

  const dragBoard = e => {
    setBoard({ ...board,
               x:e.clientX-mouseRelToEltX,
               y:e.clientY-mouseRelToEltY })
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

    let [{x:tileInitialX, y:tileInitialY}] = tiles.filter(tile=>tile.id===id);
    mouseRelToEltX = mouseX - tileInitialX;
    mouseRelToEltY = mouseY - tileInitialY;

    window.addEventListener('mousemove', dragTile);
    window.addEventListener('mouseup', stopDraggingTile);
  };

  function dragTile(e) {
    /* Intéressant : ci-dessous, au début, je n'avais pas mis "tiles =>", et donc la "closure" de la fonction incluait un état qui n'était plus à jour, ne tenant pas compte des modifications effectuées par la fonction foreground. On voyait donc la tuile qui passait au premier plan mais le quittait si je la déplaçais. */
    setTiles(tiles => tiles.map(tile =>
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
    let [{z:initialZ}] = tiles.filter(tile=>tile.id===id)

    if (initialZ !== tiles.length) {
      tiles.forEach(tile => {
        if (tile.id === id) {
          fetch(`http://localhost:5000/tiles/${id}`, {
            method: 'PATCH',
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({z: tiles.length}),
          });
        } else if (tile.z > initialZ){
          fetch(`http://localhost:5000/tiles/${tile.id}`, {
            method: 'PATCH',
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({z: tile.z-1}),
          });
        }
      });

      setTiles(tiles.map(tile =>
        tile.id===id ? {...tile, z:tiles.length}
                     : tile.z<initialZ ? tile
                                       : {...tile, z:tile.z-1}
      ));
    }
  }

  // Control z and throw error if two tiles have the same
  // TODO: less often for performance

  useEffect(() => {
    for (let i in tiles) {
      for (let j = 0; j < i; j++) {
        try {
          if (tiles[i].z === tiles[j].z) {
            throw new Error(`These two tiles have the same z :\n${tiles[j].id} "${tiles[j].text}" and ${tiles[i].id} "${tiles[i].text}"`);
          }
        } catch(e) {
          console.error(e)
        }
      }
    }
  }, [tiles]);


  // Add a new tile

  function addTile(mouseX, mouseY) {
    const tile = {
      text: '',
      truthValue: null,
      x: mouseX - board.x + initialBoardPosition[0],
      y: mouseY - board.y + initialBoardPosition[1], // TODO créer un fichier séparé
      z: tiles.length + 1,
    }
    
    fetch('http://localhost:5000/tiles', {
      method: 'POST',
      headers: {'Content-type': 'application/json'},
      body: JSON.stringify(tile),
    })
      .then(fetchTiles) // I had to write this in order to get the new id
      .then(setTiles)
      .catch(e => console.error("Couldn't fetch data:", e));
  }


  // Delete a tile
  
  function deleteTile(id) {
    fetch(`http://localhost:5000/tiles/${id}`, {method: 'DELETE',});

    setTiles(tiles.filter(tile => tile.id !== id));
  }


  // Change a tile's truth value

  function setTruthValue(id, value) {
    fetch(`http://localhost:5000/tiles/${id}`, {
      method: 'PATCH',
      headers: {'Content-type': 'application/json'},
      body: JSON.stringify({truthValue: value}),
    });

    setTiles(tiles.map(tile =>
      tile.id===id ? {...tile, truthValue: value} : tile
    ));
  }


  // Update text input by user

  function updateText(id, text) {
    setTiles(tiles.map(tile =>
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

  const [arrowTip, setArrowTip] = useState([0, 0]);
    // state used in arrow mode, represents the coordinates of the arrow tip

  // Function to update it, active when the user must choose a second tile:
  function updateArrowTip(e) {
    const targetTileId = Object.keys(tileRefs).filter(key => (tileRefs[key] === e.target))[0];
    if (targetTileId === undefined)
    {
      setArrowTip([e.clientX, e.clientY]);
    }
    else
    {
      let toX = Math.round(e.target.offsetLeft + e.target.offsetWidth/2);
      let toY = e.target.offsetTop;
      //if (fromY < toY) { fromY += tileFrom.offsetHeight; } else { toY += tileTo.offsetHeight; }
      // impossible d'implémenter cette partie pour le moment… TODO refactoriser
      setArrowTip([toX, toY]);
    }
  }
  useEffect(() => {
    if (typeof arrowMode !== "boolean") {
      window.addEventListener('mousemove', updateArrowTip);
    }
    return () => {window.removeEventListener('mousemove', updateArrowTip)};
  }, [arrowMode]);


  function drawAllArrows(ctx) {
    for (let i in arrows) {

      // References to the DOM objects representing the tiles
      let tileFrom = tileRefs[arrows[i].from-1];
      let tileTo = tileRefs[arrows[i].to-1];

      // Connects the bottom border of the tile above to the top border of the other tile
      let fromY = tileFrom.offsetTop;
      let toY = tileTo.offsetTop;
      if (fromY < toY) { fromY += tileFrom.offsetHeight; } else { toY += tileTo.offsetHeight; }

      // The arrow join the tiles at the center of their borders
      let fromX = Math.round(tileFrom.offsetLeft + tileFrom.offsetWidth/2);
      let toX = Math.round(tileTo.offsetLeft + tileTo.offsetWidth/2);

      drawDoubleArrow(ctx, fromX, fromY, toX, toY);
    }
    if (typeof arrowMode !== "boolean") {
      let tileFrom = tileRefs[arrowMode-1];
      let fromY = tileFrom.offsetTop;
      //let toX = arrowTip[0];
      //let toY = arrowTip[1];
      // Énorme problème ici. Les deux lignes précédentes et suivantes ne fonctionnent pas simultanément. Soit la pointe est mal placée sur les tuiles, soit c'est sur le reste du tableau. Je ne peux pas invoquer board depuis updateArrowTip car il ne s'y actualise pas (le scope est figé une fois que la fonction est appelée).
      let toX = arrowTip[0] - board.x;
      let toY = arrowTip[1] - board.y;
      let fromX = Math.round(tileFrom.offsetLeft + tileFrom.offsetWidth/2);
      if (fromY < toY) { fromY += tileFrom.offsetHeight; }
      drawDoubleArrow(ctx, fromX, fromY, toX, toY);
    }
  }

  useEffect(() => {
    let canvas = document.querySelector('canvas');
    if (canvas.getContext) {
      let ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, board.w, board.h);
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      drawAllArrows(ctx);
      ctx.stroke();
      ctx.closePath();
    } /*else: si canvas n'est pas supporté*/
    /* TODO: let ctx seulement au début et pas à chaque fois ? */
  });


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
      {arrows.map(arrow =>
        <Arrow
          key={arrow.id}
          arrow={arrow}
        />
      )}
      {tiles.map(tile =>
        <Tile
          key={tile.id}
          ref={saveTileRef(tile.id-1)} // I don't know how useRef() usually works but ref={tileRefs[tile.id-1]} doesn't.
          tile={tile}
          deleteTile={deleteTile}
          setTruthValue={setTruthValue}
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
