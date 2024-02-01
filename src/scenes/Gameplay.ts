import Phaser from "phaser";

const REEL_WIDTH = 160;
const SYMBOL_SIZE = 160;

// we map symbols to texture
enum Symbols {
  One = "eggHead",
  Two = "flowerTop",
  Three = "helmlok",
  Four = "skully",
}

const slotTextures = [Symbols.One, Symbols.Two, Symbols.Three, Symbols.Four];

type SymbolPrize = {
  multiplier: number;
  min: number;
  max: number;
};

// multiplier is the reward, percentage of bet
// min is the min number of symbols appeared in spin
// max is the max number of symbols appeard in spin
const prizeConfig: Record<Symbols, SymbolPrize[]> = {
  [Symbols.One]: [
    { multiplier: 0.2, min: 4, max: 7 },
    { multiplier: 0.75, min: 8, max: 12 },
    { multiplier: 2.0, min: 13, max: 15 },
  ],
  [Symbols.Two]: [
    { multiplier: 0.3, min: 4, max: 7 },
    { multiplier: 0.8, min: 8, max: 12 },
    { multiplier: 2.5, min: 13, max: 15 },
  ],
  [Symbols.Three]: [
    { multiplier: 0.5, min: 4, max: 7 },
    { multiplier: 0.9, min: 8, max: 12 },
    { multiplier: 3.0, min: 13, max: 15 },
  ],
  [Symbols.Four]: [
    { multiplier: 0.6, min: 4, max: 7 },
    { multiplier: 1.0, min: 8, max: 12 },
    { multiplier: 3.5, min: 13, max: 15 },
  ],
};

// get price of symbol
const getSymbolPrize = (symbol: Symbols, qty: number) => {
  const symbolPrize = prizeConfig[symbol];
  return symbolPrize.find((i) => i.min <= qty && i.max >= qty);
};

type Reel = {
  container: Phaser.GameObjects.Container;
  symbols: Phaser.GameObjects.Sprite[];
  position: number;
  previousPosition: number;
};

export default class Gameplay extends Phaser.Scene {
  balance = 1000;
  bet = 1;
  running = false;
  reels: Reel[] = [];

  balanceText: Phaser.GameObjects.Text;
  betText: Phaser.GameObjects.Text;

  preload() {
    this.load.image("eggHead", "eggHead.png");
    this.load.image("flowerTop", "flowerTop.png");
    this.load.image("helmlok", "helmlok.png");
    this.load.image("skully", "skully.png");
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

    this.balanceText = this.add.text(
      20,
      bot.y + 20,
      "Balance: $" + this.balance.toLocaleString(),
      {
        fontFamily: "Arial",
        fontSize: 18,
        color: "#fff",
      },
    );

    this.betText = this.add.text(
      bot.width / 2 - 200,
      bot.y + 20,
      "BET: $" + this.bet.toFixed(1),
      {
        fontFamily: "Arial",
        fontSize: 18,
        color: "#fff",
      },
    );
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
    this.balance -= this.bet;
    this.balanceText.text = "Balance: $" + this.balance.toLocaleString();

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
            this.onSpinComplete();
          }
        },
      });
    }
  }

  onSpinComplete() {
    console.log("spin complete");
    // wait animation to make sure its complete
    // add delay 1s
    setTimeout(() => {
      // store output texture key here
      const output: string[] = [];

      for (let i = 0; i < this.reels.length; i++) {
        const symbols = [...this.reels[i].symbols]
          .filter((i) => i.y >= -10 && i.y <= 2 * SYMBOL_SIZE)
          .sort((a, b) => a.y - b.y);
        symbols.forEach((s) => {
          // console.log(i, s.texture.key, s.y);
          output.push(s.texture.key);
        });
      }

      const result = output.reduce(
        (acc, cur) => {
          acc[cur] = (acc[cur] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      console.log(result);

      Object.keys(result).forEach((k) => {
        const prize = getSymbolPrize(k as Symbols, result[k]);
        if (prize) {
          console.log(k, prize);
          const amount = prize.multiplier * this.bet;
          console.log("you got $", amount);
          this.balance += amount;
          this.balanceText.text = "Balance: $" + this.balance.toLocaleString();
        }
      });

      this.running = false;
    }, 500);
  }
}
