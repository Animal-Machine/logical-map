import { useState, useEffect } from 'react';
import { getArrowHitbox } from './arrowFunctions';
import * as coordTypes from '../coordTypes'


export default function ArrowComponent(props: any) {

  const arrow:                coordTypes.ArrowCoords
    = props.arrow; 
  const switchHighlight:      (id: number, value: boolean) => void
    = props.switchHighlight; 
  const deleteArrow:          (id: number) => void
    = props.deleteArrow;


  const [hitbox, setHitbox] = useState<[coordTypes.DoubleCoords, coordTypes.DoubleCoords, coordTypes.DoubleCoords]>([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    // The arrow can be covered with three rectangles. These are their coordinates and sizes: [x, y, w, h].

  const [deleteButtonCoords, setButtonBox] = useState<coordTypes.Coords>([0, 0])
    // Hitbox of the delete button which appears when the cursor is on the arrow.
  
  const buttonSize = 44;

  useEffect(() => {
    if (arrow && arrow.coords) {
      setHitbox(getArrowHitbox(arrow.coords));
      setButtonBox(arrow.deleteButtonCoords);
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
      {/*arrow.highlight && */<button
        className="DeleteArrow"
        style = {{
          position: 'absolute',
          left: deleteButtonCoords[0] - buttonSize/2,
          top: deleteButtonCoords[1] - buttonSize/2,
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize,

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
