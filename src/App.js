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


  // Tiles State

  const [tiles, setTiles] = useState([]);

  const fetchTiles = async () => {
    const res = await fetch('http://localhost:5000/tiles');
    const data = await res.json();
    return data;
  };


  // Arrows State

  const [arrows, setArrows] = useState([]);

  const fetchArrows = async () => {
    const res = await fetch('http://localhost:5000/arrows');
    const data = await res.json();
    return data;
  }; //TODO généraliser avec fetchtiles?
  //TODO modifier ce fetch pour un fetch GET?


  // Fetch tiles and arrows on page load

  useEffect(() => {
    fetchTiles().then(setTiles).catch(e => console.error("Couldn't fetch data:", e));
    fetchArrows().then(setArrows).catch(e => console.error("Couldn't fetch data:", e));
  }, []); // I hesitated to add "tiles" but it created lag when dragging tiles


  // Arrow Mode

  const [arrowMode, setArrowMode] = useState(false);
    // This state is set to false when not in arrow mode,
    // set to true when in arrow mode without any tile selected,
    // and set to an integer which is the tile id when a first tile
    // has been clicked on. When a second tile is selected,
    // the arrow is created and the arrow mode is exited.

  function switchArrowMode() {
    setArrowMode(!arrowMode);
  }

  
  // Render

  return (
    <div className="App">
      <AppHeader arrows={arrows} setArrows={setArrows} switchArrowMode={switchArrowMode} />
      <Board
        tiles={tiles}
        setTiles={setTiles}
        fetchTiles={fetchTiles}
        arrows={arrows}
        arrowMode={arrowMode}
        setArrowMode={setArrowMode}
      />
      {/*<div style={{overflow:'hidden'}}>
        <Board arrows={arrows} />
      </div>*/}
    </div>
  );
}

export default App;
