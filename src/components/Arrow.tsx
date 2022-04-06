import { useState, useEffect } from 'react';
import { ArrowProps, SwitchHighlight } from '../types/arrows';
import { Coords } from '../types/graphDrawing';


export default function ArrowComponent(props: any) {

  const arrow:                ArrowProps
    = props.arrow;
  const switchHighlight:      SwitchHighlight
    = props.switchHighlight;
  const deleteArrow:          (id: number) => void
    = props.deleteArrow;


  const [deleteButtonCoords, setButtonBox] = useState<Coords>([0, 0]);
    // Hitbox of the delete button which appears when the cursor is on the arrow.

  const buttonSize = 44;

  useEffect(() => {
    setButtonBox(arrow.deleteButtonCoords);
  }, [arrow]);

  return(
    <div
      onMouseEnter = {() => switchHighlight(arrow.id, true,  "button")}
      onMouseLeave = {() => switchHighlight(arrow.id, false, "button")}
    >
      {(arrow.highlightedByDrawing || arrow.highlightedByButton) && <button
        className="DeleteArrow"
        style = {{
          position: 'absolute',
          left: deleteButtonCoords[0] - buttonSize/2,
          top:  deleteButtonCoords[1] - buttonSize/2,
          width:        buttonSize,
          height:       buttonSize,
          borderRadius: buttonSize,

          backgroundColor:  'white',
          border: '1px solid white',
          cursor: 'pointer',

          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
        
        onClick={() => deleteArrow(arrow.id)}
      >
        <div
          style = {{
            width:  35,
            height: 35,
            backgroundColor: 'rgba(0,0,0,0)',
          }}
        ></div>
      </button>}
    </div>
  )
}
