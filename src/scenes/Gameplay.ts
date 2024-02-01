import Phaser from "phaser";

const REEL_WIDTH = 160;
const SYMBOL_SIZE = 160;
const slotTextures = ["eggHead", "flowerTop", "helmlok", "skully"];

type Reel = {
  container: Phaser.GameObjects.Container;
  symbols: Phaser.GameObjects.Sprite[];
  position: number;
  previousPosition: number;
};

export default class Gameplay extends Phaser.Scene {
  running = false;
  reels: Reel[] = [];

  preload() {
    this.load.image("eggHead", "public/eggHead.png");
    this.load.image("flowerTop", "public/flowerTop.png");
    this.load.image("helmlok", "public/helmlok.png");
    this.load.image("skully", "public/skully.png");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x4b006e);

    const reelContainer = this.add.container(0, 0);

    // create reels
    for (let i = 0; i < 5; i++) {
      const rc = this.add.container(0, 0);
      rc.x = i * REEL_WIDTH;
      reelContainer.add(rc);

      const reel: Reel = {
        container: rc,
        symbols: [],
        position: 0,
        previousPosition: 0,
      };
      // create symbols
      for (let j = 0; j < 4; j++) {
        const symbol = this.add.sprite(
          0,
          0,
          slotTextures[Math.floor(Math.random() * slotTextures.length)],
        );
        symbol.setOrigin(0, 0);
        symbol.y = j * SYMBOL_SIZE;
        symbol.scaleX = symbol.scaleY = Math.min(
          SYMBOL_SIZE / symbol.width,
          SYMBOL_SIZE / symbol.height,
        );
        symbol.x = Math.round((SYMBOL_SIZE - symbol.width) / 2);
        reel.symbols.push(symbol);
        rc.add(symbol);
      }
      this.reels.push(reel);
    }

    // create margin and cover
    const margin = (this.sys.game.canvas.height - SYMBOL_SIZE * 3) / 2;
    reelContainer.y = margin;
    reelContainer.x = Math.round(this.sys.game.canvas.width - REEL_WIDTH * 5);

    const top = this.add.rectangle(
      0,
      0,
      this.sys.game.canvas.width,
      margin,
      0x000000,
    );
    top.setOrigin(0, 0);

    const bot = this.add.rectangle(
      0,
      SYMBOL_SIZE * 3 + margin,
      this.sys.game.canvas.width,
      margin,
      0x000000,
    );
    bot.setOrigin(0, 0);
    bot.setInteractive();
    bot.on("pointerdown", () => this.startPlay());

    const spinText = this.add.text(
      bot.width / 2,
      bot.y + bot.height / 2,
      "SPIN",
      {
        fontFamily: "Arial",
        fontSize: 24,
        color: "#00ff00",
      },
    );
    spinText.setOrigin(0.5, 0.5);
  }

  update() {
    // Update the slots.
    for (let i = 0; i < this.reels.length; i++) {
      const r = this.reels[i];

      r.previousPosition = r.position;

      // Update symbol positions on reel.
      for (let j = 0; j < r.symbols.length; j++) {
        const s = r.symbols[j];
        const prevy = s.y;

        s.y = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
        if (s.y < 0 && prevy > SYMBOL_SIZE) {
          // Detect going over and swap a texture.
          // This should in proper product be determined from some logical reel.
          s.setTexture(
            slotTextures[Math.floor(Math.random() * slotTextures.length)],
          );

          s.scaleX = s.scaleY = Math.min(
            SYMBOL_SIZE / s.texture.getSourceImage().width,
            SYMBOL_SIZE / s.texture.getSourceImage().height,
          );
          s.x = Math.round((SYMBOL_SIZE - s.width) / 2);
        }
      }
    }
  }

  // Function to start playing.
  startPlay() {
    if (this.running) return;
    this.running = true;

    for (let i = 0; i < this.reels.length; i++) {
      const r = this.reels[i];
      const extra = Math.floor(Math.random() * 3);
      const target = r.position + 10 + i * 5 + extra;
      const time = 2500 + i * 600 + extra * 600;
      // console.log({ target, time });

      this.tweens.add({
        targets: r,
        position: {
          value: target,
          duration: time,
          // ease: "Quad.easeInOut",
        },
        onComplete: () => {
          if (i === this.reels.length - 1) {
            console.log("spin complete");
            this.running = false;
          }
        },
      });
    }
  }
}
