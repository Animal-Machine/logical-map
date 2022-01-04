import { useState, useEffect } from 'react'
import './App.css';
import Board from './components/Board'
import AppHeader from './components/AppHeader'

function App() {

  const preventDef = e => e.preventDefault();
  const keydown = e => {
    if (e.code === "Escape") {
      setArrowMode(false);
    }
  }

  useEffect(() => {
    // On Mount:
    window.addEventListener('contextmenu', preventDef);
    window.addEventListener('keydown', keydown);
    return () => {
      // On Unmount:
      window.removeEventListener('contextmenu', preventDef);
      window.removeEventListener('keydown', keydown);
    }
  }, [])


  // Custom fetch functions

  const myGet = async address => {
    const res = await fetch('http://localhost:5000/'+address);
    return await res.json();
  };

  const myPost = async (address, data) => {
    return await fetch('http://localhost:5000/'+address, {
      method: 'POST',
      headers: {'Content-type': 'application/json'},
      body: JSON.stringify(data),
    });
  };


  // Tiles and Arrows States

  const [tilesContent, setTilesContent] = useState([]);
    // contains the properties "text", "truthValue" and "id"

  const [tilesCoords, setTilesCoords] = useState([]);
    // contains "x", "y" and "z" (used for css z-index property)

  const [arrows, setArrows] = useState([]);
    // contains the properties "from", "to" (ids of the linked tiles) and "id"


  function separateTileData(T) {
    // In the database, there is only one table called "tiles".
    // Therefore, I need this function to convert it into the two states
    // "tilesContent" and "tilesCoords"
    let TContent = [];
    let TCoords = [];
    T.forEach(t => {
      TContent.push({id:t.id, text:t.text, truthValue:t.truthValue});
      TCoords.push({id:t.id, x:t.x, y:t.y, z:t.z});
    });
    return {content:TContent, coords:TCoords};
  }

  function setTiles(tiles) {
    // sets tilesContent and tilesCoords with tiles data from the server
    let { content, coords } = separateTileData(tiles);
    setTilesContent(content);
    setTilesCoords(coords);
  }


  // Fetch tiles and arrows on page load

  useEffect(() => {
    myGet("tiles") .then(setTiles) .catch(e => console.error("Couldn't fetch data. ", e));
    myGet("arrows").then(setArrows).catch(e => console.error("Couldn't fetch data. ", e));
  }, []);


  // Arrow Mode

  const [arrowMode, setArrowMode] = useState(false);
    // This state is set to false when not in arrow mode,
    // set to true when in arrow mode without any tile selected,
    // and set to an integer which is the tile id when a first tile
    // has been clicked on. When a second tile is selected,
    // the arrow is created and the arrow mode is exited.

  function switchArrowMode() {
    setArrowMode(m => !m);
  }

  function addArrow(a, b) {
    if (arrows.filter(arrow => (arrow.from===a && arrow.to===b)).length === 0) {
      let newArrow = {
        from: a,
        to: b,
      };
      myPost("arrows", newArrow)
        .then(() => myGet("arrows"))
        .then(setArrows)
        .then(() => setArrowMode(false))
        .catch(e => console.error("While adding new arrow, ", e));
    }
  }

  function deleteArrow(id) {
    setArrows(arrows => arrows.filter(a => a.id !== id));
    fetch(`http://localhost:5000/arrows/${id}`, {method: 'DELETE'});
  }

  
  // Render

  return (
    <div className="App">
      <AppHeader
        myPost={myPost}
        arrows={arrows}
        setArrows={setArrows}
        switchArrowMode={switchArrowMode}
      />
      <Board
        myGet={myGet}
        myPost={myPost}
        tilesContent={tilesContent}
        setTilesContent={setTilesContent}
        tilesCoords={tilesCoords}
        setTilesCoords={setTilesCoords}
        setTiles={setTiles}
        arrows={arrows}
        setArrows={setArrows}
        arrowMode={arrowMode}
        setArrowMode={setArrowMode}
        addArrow={addArrow}
        deleteArrow={deleteArrow}
      />
      {/*<div style={{overflow:'hidden'}}>
        <Board arrows={arrows} />
      </div>*/}
    </div>
  );
}

export default App;
