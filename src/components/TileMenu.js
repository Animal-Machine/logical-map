export default function TileMenu({ tile, deleteTile, updateTruthValue, onMouseOver, onMouseLeave, closeMenu, className, style }) {

  //useEffect(() => document.querySelectorAll("button").forEach(button => button.addEventListener("click", () => closeMenu(undefined))), []) // didn't work because it was unmounting the component before executing the "onClick" handlers, so I moved closeMenu inside them

  return(
    <div
      style = {style}
      className = {className}

      onMouseOver = {onMouseOver}
      onMouseLeave = {onMouseLeave}
    >
      {tile.truthValue !== null && <button className="Undecided" onClick={() =>{closeMenu(); updateTruthValue(tile.id, null)}}></button>}
      {tile.truthValue !== true && <button className="True" onClick={() => {closeMenu(); updateTruthValue(tile.id, true)}}></button>}
      {tile.truthValue !== false && <button className="False" onClick={() => {closeMenu(); updateTruthValue(tile.id, false)}}></button>}
      <button className="Delete" onClick={() => deleteTile(tile.id)}></button>
    </div>
  );
}
