import { TileData, UpdateTruthValue } from '../types/tiles';


export default function TileMenuComponent(props: any) {

  const tile:                 TileData
    = props.tile; 
  const deleteTile:           (id: number) => void
    = props.deleteTile; 
  const updateTruthValue:     UpdateTruthValue
    = props.updateTruthValue; 
  const onMouseOver:          () => void
    = props.onMouseOver; 
  const onMouseLeave:         () => void
    = props.onMouseLeave; 
  const closeMenu:            (e?: any) => void
    = props.closeMenu; 
  const style:                object
    = props.style;


  //useEffect(() => document.querySelectorAll("button").forEach(button => button.addEventListener("click", () => closeMenu(undefined))), []) // didn't work because it was unmounting the component before executing the "onClick" handlers, so I moved closeMenu inside them

  return(
    <div
      style = {style}
      className = {"TileMenu"}

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
