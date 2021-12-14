import { getArrowHitbox } from './drawArrow.js'

export default function Arrow({ arrow }) {
  return(
    <div
      style = {{
        left: arrow.x+1920, //TODO utiliser initialBoardPosition (et pareil dans Tile.js)
        top: arrow.y+1080,
        //zIndex: tile.z,
      }}
    >
      samarch
    </div>
  )
}
