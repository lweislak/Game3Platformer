class GameOver extends Phaser.Scene {
    constructor() {
        super("gameOver");
        this.my = {text:{}};
    }
 
     preload() {
        this.load.setPath("./assets/");
        this.load.image("background", "game3Image.png");
        this.load.image("text", "Game3GameOver.png");
     }

     create() {
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        let bg  = this.add.image(0, 0, "background");
        bg.setScale(1.8);

        let txt  = this.add.image(330, 310, "text");
     }
 
     update() {
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.start("platformerScene");
        }
     }
 }