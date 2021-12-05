
function AppHeader({ arrows, setArrows }) {

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
      fetch('http://localhost:5000/tiles', {
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify(tile),
      });
    });
  }

  function addArrow() {
    if (arrows.length===0) { // strangely, it doesn't work with arrows(=)==[]
      let newArrow = {
        from: 2,
        to: 1,
      };
      fetch('http://localhost:5000/arrows', {
        method: 'POST',
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify(newArrow),
      });
      setArrows([newArrow]);
    } else {
      fetch('http://localhost:5000/arrows/1', {method: 'DELETE'});
      setArrows([]);
    }
  }

  return(
    <header className="App-header">
      <button
        onClick={addArrow}
      >
        Arrow
      </button>
      <button
        onClick={demo}
      >
        Demo
      </button>
    </header>
  );
}

export default AppHeader;
