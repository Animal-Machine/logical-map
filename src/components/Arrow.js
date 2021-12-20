import { useState, useEffect } from 'react'
import { getArrowHitbox } from './arrowFunctions.js'

export default function Arrow({ arrow }) {

  const [hitbox, setHitbox] = useState([0, 0, 0, 0]);

  useEffect(() => {
    if (arrow && arrow.coords) {setHitbox(getArrowHitbox(arrow.coords))}
    console.log(hitbox);
  }, [arrow]);

  return(
    <>
      {hitbox.map(h =>
        <div
          style = {{
            position: 'absolute',
            left: h[0],
            top: h[1],
            width: h[2],
            height: h[3],
            backgroundColor: 'rgba(255, 0, 0, 0.3)',
          }}
        >
        </div>
      )}
    </>
  )
}
