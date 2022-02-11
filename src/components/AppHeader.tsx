export default function AppHeaderComponent({ myGet, myPost, setTiles, arrows, setArrows, changeModeState }: any) {

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
