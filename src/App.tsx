import Phaser from "phaser";
import Gameplay from "./scenes/Gameplay";
import { useEffect, useRef } from "react";

const createGame = () => {
  const config: Phaser.Types.Core.GameConfig = {
    width: 800,
    height: 600,
    type: Phaser.WEBGL,
    parent: "game",
    scene: [Gameplay],
  };

  new Phaser.Game(config);
};

function App() {
  const game = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (game.current) {
      game.current.innerHTML = "";
    }
    createGame();
  }, []);

  return (
    <>
      <div id="game" ref={game}></div>
    </>
  );
}

export default App;
