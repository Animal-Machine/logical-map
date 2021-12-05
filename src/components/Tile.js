import { useState, useEffect, useRef, forwardRef } from 'react'
import TileMenu from './TileMenu'

const Tile = forwardRef(({ tile, deleteTile, setTruthValue, startDraggingTile, updateText }, ref) => {

  const [readonly, setReadonly] = useState(true);
    // state used for edition mode

  const [openedMenu, setOpenedMenu] = useState(false);
    // state used to display —or not— the TileMenu component

  const autoCloseTimerIdRef = useRef();
    // ref to store timeout ID and clear it

  useEffect((openedMenu) => {
    return () => {
      window.removeEventListener('mousedown', closeMenu);
      clearTimeout(autoCloseTimerIdRef.current);
    }
  }, []);

  function openMenu() {
    clearTimeout(autoCloseTimerIdRef.current); // just in case
    // Actually open TileMenu:
    setOpenedMenu(true);
    // Prepare TileMenu closing:
    window.addEventListener('mousedown', closeMenu);
      // first case: click somewhere else
    autoCloseTimerIdRef.current = setTimeout(closeMenu, 3000);
      // second case: time out
  }

  function closeMenu(e) {
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

  return(
    <>

      {openedMenu &&
      <TileMenu

        tile = {tile}
        deleteTile = {deleteTile}
        setTruthValue = {setTruthValue}
        closeMenu = {closeMenu}

        className = {"TileMenu"}
        style = {{
          left: tile.x+1920,
          top: tile.y+1080-50,
          position: "absolute",
          zIndex: tile.z+1,
        }}

        onMouseOver = {keepMenuOpened}
        onMouseLeave = {openMenu}
      />}

      <textarea
        ref = {ref}
        className = {"Tile" + (tile.truthValue ? " True" : (tile.truthValue===false?" False":""))
                             + (readonly ? "" : " Edition")}
        style = {{
          left: tile.x+1920, //TODO utiliser initialBoardPosition
          top: tile.y+1080,
          zIndex: tile.z,
        }}

        // Drag tile only with left button:
        onMouseDown = {e => {e.button===0 && readonly && startDraggingTile(tile.id, e.clientX, e.clientY);}}

        onContextMenu = {openMenu}

        // Enter text edition mode:
        onDoubleClick = {e => {
          e.stopPropagation();
          setReadonly(false);
        }}

        // Update state when user writes text:
        onChange = {e => updateText(tile.id, e.target.value)}

        // Quit text edition mode:
        onBlur = {e => {
          setReadonly(true);
          // Ensure that text is unselected
          // to avoid drag problem:
          e.target.selectionStart = 0;
          e.target.selectionEnd = 0;
        }}

        spellCheck = "false"
        readOnly = {readonly}
        value = {tile.text}
      > </textarea>
    </>
  );
});

export default Tile
