import { Address, TileData } from '../types/tiles';
import { Arrow, Mode } from '../types/arrows';


export default function AppHeaderComponent(props: any) {

  const myGet:              (address: Address) => Promise<any>
    = props.myGet; 
  const myPost:             (address: Address, data: object) => Promise<Response>
    = props.myPost; 
  const setTiles:           (tiles: TileData[]) => void
    = props.setTiles; 
  const arrows:             Arrow[]
    = props.arrows; 
  const setArrows:          React.Dispatch<React.SetStateAction<Arrow[]>>
    = props.setArrows; 
  const changeModeState:    (newMode: Mode) => void
    = props.changeModeState;


  function demo() {
    const demoTiles = [
      {
        text: "Socrate est un Homme.",
        truthValue: false,
        x: 40,
        y: 100,
        z: 1,
      },
      {
        text: "Tous les Hommes sont mortels.",
        truthValue: true,
        x: 60,
        y: 220,
        z: 2,
      },
      {
        text: "Socrate est mortel.",
        truthValue: null,
        x: 400,
        y: 160,
        z: 3,
      }
    ];
    demoTiles.forEach(tile => {
      myPost("tiles", tile)
        .then(() => myGet("tiles"))
        .then(setTiles)
        .catch((e: Error) => console.error("While adding a new tile:", e));
    });
  }

  return(
    <header className="App-header">
      <button
        onClick={() => changeModeState('singleArrow')}
      >
        Arrow
      </button>
      <button
        onClick={() => changeModeState('branchedArrow1')}
      >
        Branched arrow
      </button>
      <button
        onClick={demo}
      >
        Demo
      </button>
    </header>
  );
}
