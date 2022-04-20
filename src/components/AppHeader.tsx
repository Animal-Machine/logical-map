import { Address } from '../types/types';
import { TileData, TileDataPart } from '../types/tiles';
import { ArrowData, AddArrow, Mode } from '../types/arrows';


export default function AppHeaderComponent(props: any) {

  const getCookie:          (address: Address) => object[]
    = props.getCookie;
  const setTiles:           (tiles: TileData[]) => void
    = props.setTiles; 
  const addTile:            (tile: TileDataPart) => void
    = props.addTile;
  const addArrow:           AddArrow
    = props.addArrow;
  const changeModeState:    (newMode: Mode) => void
    = props.changeModeState;


  function demo() {
    const demoTiles = [
      {
        text: "Socrate est un Homme.",
        truthValue: false,
        x: 150,
        y: 160,
      },
      {
        text: "Tous les Hommes sont mortels.",
        truthValue: true,
        x: 450,
        y: 160,
      },
      {
        text: "Socrate est mortel.",
        truthValue: null,
        x: 300,
        y: 450,
      }
    ];
    for (const t of demoTiles) { addTile(t); }
    let idMax = 0;
    (getCookie("tiles") as TileData[]).forEach((t: TileData) => { if (t.id > idMax) { idMax = t.id; } })
    addArrow([idMax - 2, idMax - 1], idMax);
  }

  return(
    <header className="App-header">
      <button onClick={() => changeModeState('singleArrow')} >
        Simple Arrow
      </button>
      <button onClick={() => changeModeState('branchedArrow1')} >
        Branched Arrow
      </button>
      <button onClick={demo} >
        Demo
      </button>
    </header>
  );
}
