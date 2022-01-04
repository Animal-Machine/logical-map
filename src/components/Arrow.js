import { useState, useEffect } from 'react'
import { getArrowHitbox, getButtonBox } from './arrowFunctions.js'

export default function Arrow({ arrow, switchHighlight, deleteArrow }) {

  const [hitbox, setHitbox] = useState([0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]);
    // The arrow can be covered with three rectangles. These are their coordinates and sizes: [x, y, w, h].

  const [buttonBox, setButtonBox] = useState([0, 0, 0, 0])
    // Hitbox of the delete button which appears when the cursor is on the arrow.

  useEffect(() => {
    if (arrow && arrow.coords) {
      setHitbox(getArrowHitbox(arrow.coords));
      setButtonBox(getButtonBox(arrow.coords));
    }
  }, [arrow]);

  return(
    <div
      onMouseEnter = {() => switchHighlight(arrow.id, true)}
      onMouseLeave = {() => switchHighlight(arrow.id, false)}
    >
      {hitbox.map((h, i) =>
        <div
          key={i}
          style = {{
            position: 'absolute',
            left: h[0],
            top: h[1],
            width: h[2],
            height: h[3],
            cursor: 'default',
          }}
        >
        </div>
      )}
      {arrow.highlight && <button
        className="DeleteArrow"
        style = {{
          position: 'absolute',
          left: buttonBox[0],
          top: buttonBox[1],
          width: buttonBox[2],
          height: buttonBox[2],
          borderRadius: buttonBox[2],

          backgroundColor: 'white',
          border: '1px solid white',
          cursor: 'pointer',

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        
        onClick={() => deleteArrow(arrow.id)}
      >
        <div
          style = {{
            width: 35,
            height: 35,
            backgroundColor: 'rgba(0,0,0,0)',
          }}
        ></div>
      </button>}
    </div>
  )
}
