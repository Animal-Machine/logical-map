import { useState, useEffect, useRef, forwardRef } from 'react';
import TileMenuComponent from './TileMenu';

const TileComponent = forwardRef(({ tile, deleteTile, startDragging, updateTruthValue, updateText, arrowMode, setArrowMode }: any, ref: any) => {

  const [readonly, setReadonly] = useState(true);
    // state used for edition mode

  function onMouseDown(e: any) {
    if (arrowMode) {
      // In arrow mode, place arrow:
      if (arrowMode === true) {
        setArrowMode(tile.id);
      }
    } else {
      // Drag tile only with left button:
      e.button===0 && readonly && startDragging(tile.id, e.clientX, e.clientY);
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

  //TODO USEFUL à réexaminer. Jusqu'à l'ajout de Typescript qui m'a donné une erreur, j'avais écrit ceci :
  //useEffect((openedMenu) => {
  // Pour quelle raison ai-je mis openedMenu en paramètre ?
  // Et quand je mettais :
  //useEffect((openedMenu, closeMenu) => {
  // Il y avait un warning qui disparaissait. (Désormais impossible avec Typescript)
  // Par ailleurs, il y a peut-être des conclusions à tirer de ce que j'ai appris sur trackmouse (voir help.js)
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
                             + (arrowMode ? " ArrowMode" : "")
                             + (readonly ? "" : " Edition")}
        style = {{
          left: tile.x+1920, //TODO utiliser initialBoardPosition (et pareil dans Arrow.js)
          top: tile.y+1080,
          zIndex: tile.z,
        }}

        // Drag tile or place arrow:
        onMouseDown = {onMouseDown}

        // Open tile menu (if not in arrow mode):
        onContextMenu = {() => {
          if (!arrowMode) {openMenu()}
        }}

        // Enter text edition mode (overrides arrow mode):
        onDoubleClick = {e => {
          e.stopPropagation();
          setReadonly(false);
          setArrowMode(false);
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

export default TileComponent;
