import { useState, useEffect, useRef } from 'react';
import './Sass/App.scss';

import BoardComponent from './components/Board';
import AppHeaderComponent from './components/AppHeader';

import { Address, Method, Data, isData, isDataArray } from './types/types';
import { TileXY, TileZ, TileContent, TileDataPart, TileData, TileSelection } from './types/tiles';
import { Operator, ArrowData, Mode } from './types/arrows';


function App() {


  // Arrow modes

  const [modeState, setModeState] = useState<Mode>("default");
    // takes the value "singleArrow" or "branchedaArrow1/2" when the user is placing an arrow

  const [tileSelection, setTileSelection] = useState<TileSelection>(new TileSelection());
    // retains the ids of the tiles between which an arrow is currently being placed


  useEffect(() => {
    // response to user input depending on current mode

    const preventDef = (e: MouseEvent) => e.preventDefault();

    const keyup = (e: KeyboardEvent) => {
      switch(e.code) {

        case 'Escape':
          // Exit current mode
          setModeState('default');
          setTileSelection(new TileSelection());
          break;

        case 'Enter':
          nextStep();
          break;

        case 'Backspace':
          goBack();
          break;
      }
    }

    const nextStep = () => {
      // Choose "to" tiles
      if (modeState === 'branchedArrow1' && tileSelection.tilesFrom.length > 0) {
        setModeState('branchedArrow2');
      }
      // Finalize arrow placement
      else if (modeState === 'branchedArrow2' && tileSelection.tilesTo.length > 0) {
        addArrow(tileSelection.tilesFrom, tileSelection.tilesTo, '', ''); // also sets modeState and tileSelection to their default value
      }
    }

    const goBack = () => {
      // Allows the user to unselect the previous tile
      // or exit arrow mode with a right click
      switch(modeState) {

        case 'singleArrow':
          switch(tileSelection.tilesFrom.length) {
            case 0:
              setModeState('default');
              break;
            case 1:
              setTileSelection(new TileSelection());
              break;
            default:
              throw new Error("In single arrow mode, there can be only one selected tile.");
          }
          break;

        case 'branchedArrow1':
          if (!tileSelection.tilesFrom.length) {
            setModeState('default');
          } else {
            setTileSelection(tileSelection => ({tilesFrom: tileSelection.tilesFrom.slice(0,-1), tilesTo: []}));
          }
          break;

        case 'branchedArrow2':
          if (tileSelection.tilesTo.length === 0) {
            setModeState('branchedArrow1');
          } else {
            setTileSelection(tileSelection => ({...tileSelection, tilesTo: tileSelection.tilesTo.slice(0,-1)}));
          }
          break;
      }
    }


    // On Mount:
    window.addEventListener('contextmenu', preventDef);
    window.addEventListener('contextmenu', goBack);
    window.addEventListener('click', nextStep);
    window.addEventListener('keyup', keyup);

    return () => {
      // On Unmount:
      window.removeEventListener('contextmenu', preventDef);
      window.removeEventListener('contextmenu', goBack);
      window.removeEventListener('click', nextStep);
      window.removeEventListener('keyup', keyup);
    }

  }, [modeState, tileSelection])


  function changeModeState(newMode: Mode) {
    setModeState((currentMode: Mode) => {
      if (currentMode === newMode) {
        return 'default';
      }
      else { return newMode; }
    });
    setTileSelection(new TileSelection());
  }



  // Functions to store and retrieve data in cookies

  function getCookie(address: Address): any {
    for (let cookie of document.cookie.split('; ')) {
      let c = cookie.split('=');
      if (c[0] === address) {
        return JSON.parse(c[1]);
      }
    }
    return [];
  };

  function writeCookie(address: Address, dataArray: Data[]) {
    document.cookie = address + "=" + JSON.stringify(dataArray) + `;max-age=${30*24*60*60}`;
  };

  function changeCookieData(address: Address, data: object, method: Method, id: number|undefined = undefined) {
    let dataArray = getCookie(address);
    if (isDataArray(dataArray)) {
      switch(method) {
        case "post":
          let idMax = 0;
          for (let d of dataArray) {
            if (d.id > idMax) { idMax = d.id; }
          }
          dataArray.push({...data, id: idMax+1});
          writeCookie(address, dataArray);
          break;
        case "delete":
          writeCookie(address, dataArray.filter((d: Data) => d.id !== id));
          break;
        case "patch":
          writeCookie(address, dataArray.map((d: Data) => d.id !== id ? d : {...d, ...data}));
          break;
      }
    }
    else {
      throw new Error("The Cookie is not of type DataArray.");
    }
  }

  function postCookieData(address: Address, data: object) {
    changeCookieData(address, data, "post");
  }
  function deleteCookieData(address: Address, id: number) {
    changeCookieData(address, {}, "delete", id);
  }
  function patchCookieData(address: Address, id: number, data: object) {
    changeCookieData(address, data, "patch", id);
  }

  const patchTile = (id: number, updatedProperties: object) => patchCookieData("tiles", id, updatedProperties)


  // Tiles and Arrows States

  const [tilesContent, setTilesContent] = useState<TileContent[]>([]);
    // contains the properties "text", "truthValue" and "id"

  const [tilesXY, setTilesXY] = useState<TileXY[]>([]);
    // position on the board

  const [tilesZ, setTilesZ] = useState<TileZ[]>([]);
    // relative height, used by css property z-index

  const zMaxRef = useRef<TileZ>({z:0, id:0});

  const [arrows, setArrows] = useState<ArrowData[]>([]);
    // contains the properties "tilesFrom", "tilesTo" (ids of the linked tiles) and "id"


  // Loading tiles and arrows on page

  useEffect(() => {
    let loadedTiles = getCookie("tiles");
    if (loadedTiles.length === 0) {
      // If there is no tile, zMax is reset to 0:
      zMaxRef.current = {id: 0, z: 0};
    }
    else {
      let zValues = loadedTiles.map((t: TileData) => t.z);
      let max = Math.max(...zValues);
      let id = loadedTiles.filter((t: TileData) => t.z === max)[0].id
      // if the highest z is too big, we reset z values to keep them reasonably small:
      // TODO do the same for id or delete this, for consistency
      if (max > 50 * zValues.length) {
        zValues.sort(); // to keep the z-order, we use the indexes of the z values
        zMaxRef.current = {id: id, z: zValues.length}; // zMax initialization (reset)
        loadedTiles = loadedTiles.map((t: TileData) => ({...t, z: zValues.indexOf(t.z)+1}));
        for (const tile of loadedTiles) {
          patchTile(tile.id, {z: tile.z});
        };
      }
      else {
        zMaxRef.current = {id: id, z: max}; // zMaxRef.current initialization
      }
    }
    setTiles(loadedTiles);
    setArrows(getCookie("arrows"));
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

  function addTile(tile: TileDataPart) {
    postCookieData("tiles", {...tile, z: zMaxRef.current.z+1});
    const updatedTiles = getCookie("tiles");
    setTiles(updatedTiles);
    zMaxRef.current = {id: updatedTiles.filter((t: TileData) => t.z === zMaxRef.current.z+1)[0].id, z: zMaxRef.current.z+1};
  }

  // Delete a tile

  function deleteTile(id: number) {
    // deletes arrows tied to the tile first, then the tile itself.

    for (let i = 0; i < arrows.length; i++) {
      let a = arrows[i];
      // We assume that the same id cannot be both in tilesFrom and tilesTo.
      if (a.tilesFrom.includes(id) || a.tilesTo.includes(id)) {
        if ((a.tilesFrom.length === 1 && a.tilesFrom[0] === id) || (a.tilesTo.length === 1 && a.tilesTo[0] === id)) {
          deleteCookieData("arrows", a.id);
        }
        else {
          if (a.tilesFrom.includes(id)) {
            patchCookieData("arrows", a.id, {tilesFrom: a.tilesFrom.filter((tile: number) => tile !== id)});
          }
          else {
            patchCookieData("arrows", a.id, {tilesTo: a.tilesTo.filter((tile: number) => tile !== id)});
          }
        }
      }
    }
    setArrows(getCookie("arrows"));
    deleteCookieData("tiles", id);
    setTiles(getCookie("tiles"));
  }

  // Change a tile's truth value

  function updateTileTruthValue(id: number, value: boolean|null) {
    patchTile(id, {truthValue: value})
    setTilesContent((t: TileContent[]) => t.map((tile: TileContent) =>
      tile.id===id ? {...tile, truthValue: value} : tile
    ));
  }

  // Change a tile's text

  function updateTileText(id: number, text: string) {
    setTilesContent((t: TileContent[]) => t.map((tile: TileContent) =>
      tile.id===id ? {...tile, text:text} : tile
    ));
  }


  // Add and delete arrows

  function addArrow(a: number | number[], b: number | number[], operator1: Operator = '', operator2: Operator = '') {
    if (typeof a === 'number') { a = [a]; }
    if (typeof b === 'number') { b = [b]; }
    if (arrows.filter(arrow => (arrow.tilesFrom===a && arrow.tilesTo===b)).length === 0) {
      let newArrow = {
        tilesFrom: a,
        tilesTo: b,
        operator1: operator1,
        operator2: operator2,
      };
      postCookieData("arrows", newArrow)
      setArrows(getCookie("arrows"));
      setModeState('default')
      setTileSelection(new TileSelection())
    }
  }

  function deleteArrow(id: number) {
    deleteCookieData("arrows", id);
    setArrows(getCookie("arrows"));
  }

  
  // Render

  return (
    <div className="App">
      <AppHeaderComponent
        getCookie={getCookie}
        setTiles={setTiles}
        addTile={addTile}
        addArrow={addArrow}
        changeModeState={changeModeState}
      />
      <div className="Board-container">
        <BoardComponent
          ref={zMaxRef}
          getCookie={getCookie}
          addTile={addTile}
          deleteTile={deleteTile}
          patchTile={patchTile}
          mergeTileData={mergeTileData}
          separateTileData={separateTileData}
          updateTileTruthValue={updateTileTruthValue}
          updateTileText={updateTileText}
          tilesContent={tilesContent}
          tilesXY={tilesXY}
          setTilesXY={setTilesXY}
          tilesZ={tilesZ}
          setTilesZ={setTilesZ}
          arrows={arrows}
          setArrows={setArrows}
          modeState={modeState}
          setModeState={setModeState}
          tileSelection={tileSelection}
          setTileSelection={setTileSelection}
          addArrow={addArrow}
          deleteArrow={deleteArrow}
        />
      </div>
    </div>
  );
}

export default App;
