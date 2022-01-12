import { useState, useEffect } from 'react';
import './App.css';
import BoardComponent from './components/Board';
import AppHeaderComponent from './components/AppHeader';
import { Address, TileData, TileContent, TileCoords, Arrow } from './types';

function App() {

  const preventDef = (e: MouseEvent) => e.preventDefault();
  const keydown = (e:KeyboardEvent) => {
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

  const myGet = async (address: Address) => {
    const res = await fetch('http://localhost:5000/'+address);
    return await res.json();
  };

  const myPost = async (address: Address, data: object) => {
    return await fetch('http://localhost:5000/'+address, {
      method: 'POST',
      headers: {'Content-type': 'application/json'},
      body: JSON.stringify(data),
    });
  };

  const patchTile = async (id: number, updatedProperties: object) => {
    return await fetch(`http://localhost:5000/tiles/${id}`, {
      method: 'PATCH',
      headers: {'Content-type': 'application/json'},
      body: JSON.stringify(updatedProperties),
    });
  }


  // Tiles and Arrows States

  const [tilesContent, setTilesContent] = useState<TileContent[]>([]);
    // contains the properties "text", "truthValue" and "id"

  const [tilesCoords, setTilesCoords] = useState<TileCoords[]>([]);
    // contains "x", "y" and "z" (used for css z-index property)

  const [arrows, setArrows] = useState<Arrow[]>([]);
    // contains the properties "from", "to" (ids of the linked tiles) and "id"
  
  function separateTileData(T: TileData[]) {
    // In the database, there is only one table called "tiles".
    // Therefore, I need this function to convert it into the two states
    // "tilesContent" and "tilesCoords"
    let TContent: TileContent[] = [];
    let TCoords: TileCoords[] = [];
    T.forEach(t => {
      TContent.push({id:t.id, text:t.text, truthValue:t.truthValue});
      TCoords.push({id:t.id, x:t.x, y:t.y, z:t.z});
    });
    return {content:TContent, coords:TCoords};
  }

  function setTiles(tiles: TileData[]) {
    // sets tilesContent and tilesCoords with tiles data from the server
    let { content, coords } = separateTileData(tiles);
    setTilesContent(content);
    setTilesCoords(coords);
  }

  // Add a new tile

  function addTile(tile: TileData) {
    myPost("tiles", tile)
      .then(() => myGet("tiles"))
        // I need to get the id of the new tile to place arrow, hence this fetch GET
        // Note: it isn't .then(myGet("tiles")) because .then needs a function, not a promise
      .then(setTiles)
      .catch((e: Error) => console.error("While adding a new tile:", e));
  }

  // Delete a tile

  function deleteTile(id: number) {
    // deletes arrows tied to the tile first, then the tile itself.

    (async function() {
      let arrowList: number[] = [];
      // Tried this:
      //await Promise.all(arrows.map(a => async () => {
      // which didn't work. Why?
      // TODO UNDERSTAND
      // And I didn't understand either the solution I found on the web:
      await Promise.all(arrows.map(async (a: Arrow) => {
        if (a.from === id || a.to === id) {
          await fetch(`http://localhost:5000/arrows/${a.id}`, {method: 'DELETE',});
          arrowList.push(a.id);
        }
      }));
      return arrowList;
    })()
      .then(res => setArrows((arrows: Arrow[]) => arrows.filter((a: Arrow) => !res.includes(a.id))))
      .then(() => fetch(`http://localhost:5000/tiles/${id}`, {method: 'DELETE',}))
      .then(() => setTilesContent((t: TileContent[]) => t.filter((tile: TileContent) => tile.id !== id)))
      .then(() => setTilesCoords((t: TileCoords[]) => t.filter((tile: TileCoords) => tile.id !== id)))
      .catch((e: Error) => console.error("While deleting arrows:", e));
  }

  // Change a tile's truth value

  function updateTileTruthValue(id: number, value: boolean|null) {
    patchTile(id, {truthValue: value})
      .catch((e: Error) => console.error("While setting a tile's new truth value:", e));
    setTilesContent((t: TileContent[]) => t.map((tile: TileContent) =>
      tile.id===id ? {...tile, truthValue: value} : tile
    ));
  }

  // Change a tile's text

  function updateTileText(id: number, text:string) {
    patchTile(id, {text: text})
      .catch((e: Error) => console.error("While setting a tile's new text:", e));
      // Est-ce que ce n'est pas trop gourmand d'envoyer une requête à chaque caractère ajouté ou supprimé ? TODO à réfléchir
    setTilesContent((t: TileContent[]) => t.map((tile: TileContent) =>
      tile.id===id ? {...tile, text:text} : tile
    ));
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

  function addArrow(a: number, b: number) {
    if (arrows.filter(arrow => (arrow.from===a && arrow.to===b)).length === 0) {
      let newArrow = {
        from: a,
        to: b,
      };
      myPost("arrows", newArrow)
        .then(() => myGet("arrows"))
        .then(setArrows)
        .then(() => setArrowMode(false))
        .catch(e => console.error("While adding new arrow:", e));
    }
  }

  function deleteArrow(id: number) {
    setArrows(arrows => arrows.filter(a => a.id !== id));
    fetch(`http://localhost:5000/arrows/${id}`, {method: 'DELETE'});
  }

  
  // Render

  return (
    <div className="App">
      <AppHeaderComponent
        myGet={myGet}
        myPost={myPost}
        setTiles={setTiles}
        arrows={arrows}
        setArrows={setArrows}
        switchArrowMode={switchArrowMode}
      />
      <BoardComponent
        addTile={addTile}
        deleteTile={deleteTile}
        patchTile={patchTile}
        updateTileTruthValue={updateTileTruthValue}
        updateTileText={updateTileText}
        tilesContent={tilesContent}
        tilesCoords={tilesCoords}
        setTilesCoords={setTilesCoords}
        arrows={arrows}
        setArrows={setArrows}
        arrowMode={arrowMode}
        setArrowMode={setArrowMode}
        addArrow={addArrow}
        deleteArrow={deleteArrow}
      />
    </div>
  );
}

export default App;
