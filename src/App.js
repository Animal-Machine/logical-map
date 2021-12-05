import { useState, useEffect } from 'react'
import './App.css';
import Board from './components/Board'
import AppHeader from './components/AppHeader'

function App() {
  window.addEventListener('contextmenu', e => e.preventDefault());


  // Tiles State

  const [tiles, setTiles] = useState([]);

  const fetchTiles = async () => {
    const res = await fetch('http://localhost:5000/tiles');
    const data = await res.json();
    return data;
  };

  useEffect(() => {
  }, []); // I hesitated to add "tiles" but it created lag when dragging tiles


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

  
  // Render

  return (
    <div className="App">
      <AppHeader arrows={arrows} setArrows={setArrows} />
      <Board tiles={tiles} setTiles={setTiles} fetchTiles={fetchTiles} arrows={arrows} />
      {/*<div style={{overflow:'hidden'}}>
        <Board arrows={arrows} />
      </div>*/}
    </div>
  );
}

export default App;
