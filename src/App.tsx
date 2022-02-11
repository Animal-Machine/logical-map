import { useState, useEffect } from 'react';
import './App.css';
import BoardComponent from './components/Board';
import AppHeaderComponent from './components/AppHeader';
import { Address, TileData, TileContent, TileXY, TileZ, Operator, Arrow } from './types';

function App() {


  useEffect(() => {
    const preventDef = (e: MouseEvent) => e.preventDefault();
    const keydown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        setArrowMode(false);
      }
    }
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

  const myServerAddress = "http://localhost:5000/";

  const myGet = async (address: Address) => {
    const res = await fetch(myServerAddress + address);
    return await res.json();
  };

  const myPost = async (address: Address, data: object) => {
    return await fetch(myServerAddress + address, {
      method: 'POST',
      headers: {'Content-type': 'application/json'},
      body: JSON.stringify(data),
    });
  };

  const patchTile = async (id: number, updatedProperties: object) => {
    return await fetch(`${myServerAddress}tiles/${id}`, {
      method: 'PATCH',
      headers: {'Content-type': 'application/json'},
      body: JSON.stringify(updatedProperties),
    });
  }


  // Tiles and Arrows States

  const [tilesContent, setTilesContent] = useState<TileContent[]>([]);
    // contains the properties "text", "truthValue" and "id"

  const [tilesXY, setTilesXY] = useState<TileXY[]>([]);
    // position on the board

  const [tilesZ, setTilesZ] = useState<TileZ[]>([]);
    // relative height, used by css property z-index

  let [zMax, setZMax] = useState<TileZ>({z:0, id:0});
    // contains the highest z coordinate, used when putting a tile to the foreground

  const [arrows, setArrows] = useState<Arrow[]>([]);
    // contains the properties "tileFrom", "tileTo" (ids of the linked tiles) and "id"


  // Loading tiles and arrows on page

  useEffect(() => {
    myGet("tiles")
      .then((tiles: TileData[]): [TileData[], boolean] => {
        if (tiles.length === 0) {
          // If there is no tile, zMax is reset to 0:
          setZMax({id: 0, z: 0});
          // Because of this "false", the next "then" is practically going to be ignored:
          return([tiles, false]);
        }
        let zValues = tiles.map((t: TileData) => t.z);
        let max = Math.max(...zValues);
        let id = tiles.filter((t: TileData) => t.z === max)[0].id
        // if the highest z is too big, we reset z values to keep them reasonably small:
        if (max > 50 * zValues.length) {
          zValues.sort(); // to keep the z-order, we use the indexes of the z values
          setZMax({id: id, z: zValues.length}); // zMax initialization (reset)
          return([tiles.map((t: TileData) => ({...t, z: zValues.indexOf(t.z)+1})), true]);
            // tiles with updated z are passed on to "then"
        }
        setZMax({id: id, z: max}); // zMax initialization
        return([tiles, false]);
      })
      .then(([tiles, zReset]): Promise<TileData[]> => {
        // update z on server if needed, and pass "tiles" on again
        if (zReset) {
          return (async function() {
            for (const tile of tiles) {
              await patchTile(tile.id, {z: tile.z});
            };
          })().then(() => tiles);
        } else {
          return Promise.resolve(tiles);
        }
      })
      .then(setTiles)
      .then(() => myGet("arrows"))
      .then(setArrows)
      .catch(e => console.error("Couldn't fetch data.", e));
  }, []);


  function mergeTileData(TContent: TileContent[], TXY: TileXY[], TZ: TileZ[]): TileData[] {
    // In the database, there is only one table called "tiles".
    // Therefore, I need this function to convert the three states
    // "tilesContent", "tilesXY" and "tilesZ" to it.
    let T: TileData[] = [];
    for (let i = 0; i < TContent.length; i++) {
      let id = TContent[i].id;
      let txy = TXY.filter((t: TileXY) => t.id === id);
      let tz = TZ.filter((t: TileZ) => t.id === id);
      if (txy.length && tz.length) {
        T.push({...TContent[i], ...txy[0], ...tz[0]});
      }
    }
    return T;
  }

  function separateTileData(T: TileData[]): {content:TileContent[], coordsXY:TileXY[], coordsZ:TileZ[]} {
    // inverse function of mergeTileData
    let TContent: TileContent[] = [];
    let TXY: TileXY[] = [];
    let TZ: TileZ[] = [];
    T.forEach(t => {
      TContent.push({id:t.id, text:t.text, truthValue:t.truthValue});
      TXY.push({id:t.id, x:t.x, y:t.y});
      TZ.push({id:t.id, z:t.z});
    });
    return {content:TContent, coordsXY:TXY, coordsZ:TZ};
  }

  function setTiles(tiles: TileData[]) {
    // sets tilesContent and tilesXY with tiles data from the server
    let { content, coordsXY, coordsZ } = separateTileData(tiles);
    setTilesContent(content);
    setTilesXY(coordsXY);
    setTilesZ(coordsZ);
  }

  // Add a new tile

  function addTile(tile: TileData) {
    myPost("tiles", {...tile, z: zMax.z+1})
      .then(() => myGet("tiles"))
        // I need to get the id of the new tile to place arrow, hence this fetch GET
        // Note: it isn't .then(myGet("tiles")) because .then needs a function, not a promise
      .then((newTiles: TileData[]) => {
        setTiles(newTiles);
        return newTiles.filter((t: TileData) => t.z === zMax.z+1)[0].id;
      })
      .then((id: number) => setZMax(zMax => ({id: id, z: zMax.z+1})))
      .catch((e: Error) => console.error("While adding a new tile:", e));
  }

  // Delete a tile

  function deleteTile(id: number) {
    // deletes arrows tied to the tile first, then the tile itself.

    (async function() {
      let arrowList: number[] = [];
      for (let i = 0; i < arrows.length; i++) {
        let a = arrows[i];
        if (a.tileFrom.includes(id) || a.tileTo.includes(id)) {
          await fetch(`${myServerAddress}arrows/${a.id}`, {method: 'DELETE',});
          arrowList.push(a.id);
        }
      }
      await Promise.all(arrows.map(async (a: Arrow) => {
      }));
      return arrowList;
    })()
      .then(res => {
        fetch(`${myServerAddress}tiles/${id}`, {method: 'DELETE',});
        return res;
      })
      .then(res => {
        setArrows((arrows: Arrow[]) => arrows.filter((a: Arrow) => !res.includes(a.id)));
        setTilesContent((t: TileContent[]) => t.filter((tile: TileContent) => tile.id !== id));
        setTilesXY((t: TileXY[]) => t.filter((tile: TileXY) => tile.id !== id));
        setTilesZ((t: TileZ[]) => t.filter((tile: TileZ) => tile.id !== id));
      })
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


  // Arrow Mode

  const [arrowMode, setArrowMode] = useState(false);
    // This state is set to false when not in arrow mode,
    // set to true when in arrow mode without any tile selected,
    // and set to an integer which is the tile id when a first tile
    // has been clicked on. When a second tile is selected,
    // the arrow is created and the arrow mode is exited.
 
  useEffect(() => {
    const goBack = (e: MouseEvent) => {
      // Allows the user to unselect the first tile
      // or exit arrow mode with a right click
      if (typeof arrowMode === "number") {
        setArrowMode(true);
      } else { setArrowMode(false); }
    }

    window.addEventListener('contextmenu', goBack);
    return () => {
      window.removeEventListener('contextmenu', goBack);
    }
  }, [arrowMode])

  function switchArrowMode() {
    setArrowMode(m => !m);
  }


  // Add and delete arrows

  function addSimpleArrow(a: number, b: number) {
    addArrow(a, b, '', '');
  }

  function addArrow(a: number, b: number, operator1: Operator, operator2: Operator) {
    if (arrows.filter(arrow => (arrow.tileFrom===[a] && arrow.tileTo===[b])).length === 0) {
      let newArrow = {
        tileFrom: [a],
        tileTo: [b],
        operator1: operator1,
        operator2: operator2,
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
    fetch(`${myServerAddress}arrows/${id}`, {method: 'DELETE'});
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
        mergeTileData={mergeTileData}
        updateTileTruthValue={updateTileTruthValue}
        updateTileText={updateTileText}
        tilesContent={tilesContent}
        tilesXY={tilesXY}
        setTilesXY={setTilesXY}
        tilesZ={tilesZ}
        setTilesZ={setTilesZ}
        zMax={zMax}
        setZMax={setZMax}
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
