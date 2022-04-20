import { useState, useEffect, useRef, forwardRef, MouseEvent } from 'react';

import TileMenuComponent from './TileMenu';

import { TileData, TileSelection, UpdateTruthValue } from '../types/tiles';
import { Operator, Mode, AddArrow } from '../types/arrows';
import { Coords } from '../types/graphDrawing';


const TileComponent = forwardRef((props: any, ref: any) => {

  const origin:               Coords
    = props.origin;
  const tile:                 TileData
    = props.tile;
  const deleteTile:           (id: number) => void
    = props.deleteTile;
  const startDragging:        (id: number, mouseX: number, mouseY: number) => void
    = props.startDragging;
  const updateTruthValue:     UpdateTruthValue
    = props.updateTruthValue;
  const updateText:           (id: number, text: string) => void
    = props.updateText;
  const saveText:             (id: number, text: string) => void
    = props.saveText;
  const modeState:            Mode
    = props.modeState;
  const setModeState:         React.Dispatch<React.SetStateAction<Mode>>
    = props.setModeState;
  const tileSelection:        TileSelection
    = props.tileSelection;
  const setTileSelection:     React.Dispatch<React.SetStateAction<TileSelection>>
    = props.setTileSelection;
  const addArrow:             AddArrow
    = props.addArrow;



  const width = 180;
  const height = 90;


  const [readOnly, setReadOnly] = useState(true);
    // state used for edition mode

  function enterTextEditionMode(e: React.MouseEvent) {
    e.stopPropagation();
    setReadOnly(false);
    setModeState('default'); // overrides arrow mode
    setTileSelection(new TileSelection());
  }

  function quitTextEditionMode(e: React.FocusEvent | React.KeyboardEvent) {
    setReadOnly(true);
    // Ensure that text is unselected to avoid drag problem:
    (e.target as HTMLInputElement).selectionStart = 0;
    (e.target as HTMLInputElement).selectionEnd = 0;
    saveText(tile.id, (e.target as HTMLTextAreaElement).value);
  }

  // Tile behaviour depending on mode

  function onMouseDown(e: React.MouseEvent) {

    switch(modeState) {

      case 'singleArrow':
        if (!tileSelection.tilesFrom.length) {
          setTileSelection({tilesFrom: [tile.id], tilesTo: []});
        } else if (tile.id !== tileSelection.tilesFrom[0]) {
          addArrow(tileSelection.tilesFrom[0], tile.id); // also sets modeState and tileSelection to their default value
        }
        break;

      case 'branchedArrow1':
        if (!tileSelection.tilesFrom.includes(tile.id)) {
          setTileSelection((tileSelection: TileSelection) => ({tilesFrom: [...tileSelection.tilesFrom, tile.id], tilesTo: []}));
        }
        break;

      case 'branchedArrow2':
        if (!tileSelection.tilesFrom.concat(tileSelection.tilesTo).includes(tile.id)) {
          setTileSelection((tileSelection: TileSelection) => ({tilesFrom: tileSelection.tilesFrom, tilesTo: [...tileSelection.tilesTo!, tile.id]}));
        }
        break;

      default:
        // Drag tile only with left button:
        e.button===0 && readOnly && startDragging(tile.id, e.clientX, e.clientY);
    }
  }


  // Opening and closing the TileMenu sub-component

  const [openedMenu, setOpenedMenu] = useState(false);
    // state used to display —or not— the TileMenu component

  const autoCloseTimerIdRef = useRef<NodeJS.Timeout>(setTimeout(()=>{}, 0));
    // ref to store timeout ID and clear it

  function openMenu() {
    clearTimeout(autoCloseTimerIdRef.current); // just in case
    // Actually open TileMenu:
    setOpenedMenu(true);
    // Prepare TileMenu closing:
    window.addEventListener('mousedown', closeMenu);
      // first case: click somewhere else
    autoCloseTimerIdRef.current = setTimeout(closeMenu, 5000);
      // second case: time out
  }

  function closeMenu(e: any) {
    // e will be undefined if closeMenu() is called by setTimeout or the TileMenu buttons onclick handlers
    if (e === undefined || (e.target.className !== "TileMenu" && !(e.target.tagName === "BUTTON" && ["Undecided", "True", "False", "Delete"].includes(e.target.className)))) {
      setOpenedMenu(false);
      window.removeEventListener('mousedown', closeMenu);
      clearTimeout(autoCloseTimerIdRef.current);
    }
  }

  function keepMenuOpened() {
    clearTimeout(autoCloseTimerIdRef.current);
  }

  useEffect(() => {
    return () => {
      window.removeEventListener('mousedown', closeMenu);
      clearTimeout(autoCloseTimerIdRef.current);
    }
  }, []);



  return(
    <>

      {openedMenu &&
      <TileMenuComponent

        tile = {tile}
        deleteTile = {deleteTile}
        updateTruthValue = {updateTruthValue}
        closeMenu = {closeMenu}

        style = {{
          position: "absolute",
          left: tile.x + origin[0] - width/2,
          top: tile.y + origin[1]-50 - height/2,
          width: width,
          height: 45,
          zIndex: tile.z+1,
        }}

        onMouseOver = {keepMenuOpened}
        onMouseLeave = {openMenu}
      />}

      <textarea
        ref = {ref}
        className = {"Tile" + (tile.truthValue ? " True" : (tile.truthValue===false?" False":""))
                            + (modeState!=='default' ? " ArrowMode" : "")
                            + (readOnly ? "" : " Edition")
                            + ((tileSelection.tilesFrom.includes(tile.id)
                               || tileSelection.tilesTo.includes(tile.id)) ? " Unselectable" : "")
        }
        style = {{
          position: "absolute",
          left: tile.x + origin[0] - width/2,
          top: tile.y + origin[1] - height/2,
          width: width,
          height: height,
          resize: "none",
          zIndex: tile.z,
        }}

        // Drag tile or place arrow:
        onMouseDown = {onMouseDown}

        // Open tile menu (if not in arrow mode):
        onContextMenu = {() => {
          if (modeState === 'default') {openMenu()}
        }}

        // Needed particularly for branched arrow placement:
        onClick = {(e: React.MouseEvent) => e.stopPropagation()}

        // Text edition mode:
        onDoubleClick = {enterTextEditionMode}
        onBlur = {quitTextEditionMode}
        onKeyUp = {(e: React.KeyboardEvent) => {
          if (e.code === 'Escape') { quitTextEditionMode(e); }
        }}

        // Update state when user writes text:
        onChange = {(e: React.ChangeEvent) => updateText(tile.id, (e.target as HTMLTextAreaElement).value)}

        spellCheck = "false"
        readOnly = {readOnly}
        value = {tile.text}
      > </textarea>
    </>
  );
});

export default TileComponent;
