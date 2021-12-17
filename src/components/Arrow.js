import { getArrowHitbox } from './arrowFunctions.js'

export default function Arrow({ arrow }) {
  return(
    <div
      onClick = {() => console.log(getArrowHitbox(arrow))}
      style = {{
        left: getArrowHitbox(arrow)[0],
        top: getArrowHitbox(arrow)[1],
      }}
    >
      Flèche
    </div>
  )
}
