// global variables
var timeLimit = 2; // timeLimit for countdown in seconds
var timeOver = false; // set to false at start
var timeBar; // display time remaining

class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }


    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 600;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -500;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
    }

    //TODO: Add timer, add water collision
    //TODO: Add game over/death, add restart
    create() {
        this.setMap();
        this.setTimer();

        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects
        this.doughnut = this.map.createFromObjects("objects", {
            name: "doughnut",
            key: "food_sheet",
            frame: 14
        });
        this.burger = this.map.createFromObjects("objects", {
            name: "burger",
            key: "food_sheet",
            frame: 92
        });
        this.sushi = this.map.createFromObjects("objects", {
            name: "sushi",
            key: "food_sheet",
            frame: 103
        });

        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.doughnut, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.burger, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.sushi, Phaser.Physics.Arcade.STATIC_BODY);

        //TODO: Combine these into a single group
        this.doughnutGroup = this.add.group(this.doughnut);
        this.burgerGroup = this.add.group(this.burger);
        this.sushiGroup = this.add.group(this.sushi);

        this.setPlayer();

        //Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer1);
        this.physics.add.collider(my.sprite.player, this.groundLayer2);

        this.checkCollision(this.burgerGroup);
        this.checkCollision(this.doughnutGroup);
        this.checkCollision(this.sushiGroup);

        //Set keys
        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey('R');
        this.spaceKey = this.input.keyboard.addKey('SPACE');

        this.movementVFX();
        this.setCamera();
    }

    //Set up tilemap
    setMap() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 100 tiles wide and 50 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 100, 50);
        this.physics.world.setBounds(0, 0, 100*18, 50*18);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("platforms-packed", "tilemap_tiles");
        this.backgroundTileset = this.map.addTilesetImage("background-packed", "background_tiles");

        // Create a layer
        this.background = this.map.createLayer("background", this.backgroundTileset, 0, 0);
        this.groundLayer1 = this.map.createLayer("platforms-1", this.tileset, 0, 0);
        this.groundLayer2 = this.map.createLayer("platforms-2", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer1.setCollisionByProperty({
            collides: true
        });

        this.groundLayer2.setCollisionByProperty({
            collides:true
        });

        this.groundLayer1.setCollision(false,false,true,false); //TODO: Fix
    }

    //Check collision for multiple food objects with player
    checkCollision(food) {
        this.physics.add.overlap(my.sprite.player, food, (obj1, obj2) => {
            obj2.destroy(); //remove food on overlap
        });
    }

     //Set up player avatar
    setPlayer() {
        my.sprite.player = this.physics.add.sprite(30, 345, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
    }

    //Add particles to player movement
    movementVFX() {
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();
    }

    //Set up the camera
    setCamera() {
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
    }

    //Reference: https://docs.idew.org/video-game/project-references/phaser-coding/timers
    setTimer() {
        // change position if needed (but use same position for both images)
        //var backgroundBar = this.add.image(this.map.widthInPixels - 360, this.map.heightInPixels - 300, 'red-bar');
        //backgroundBar.fixedToCamera = true;

        this.backgroundBar = this.add.image(window.innerWidth/2.8, window.innerHeight/3.4, 'red-bar');
        this.backgroundBar.setScrollFactor(0);

        this.timeBar = this.add.image(window.innerWidth/2.8, window.innerHeight/3.4, 'green-bar');
        this.timeBar.setScrollFactor(0);
    }


    update(time) {
        this.checkKeyPress();
        if (timeOver == false) {
            this.displayTimeRemaining(time);
        } else {
            this.scene.start("gameOver");
        }
    }

    //Check for specific key presses
    //Handles player movement and restarting the game
    checkKeyPress() {
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) { // Only play smoke effect if touching the ground
                my.vfx.walking.start();
            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) { // Only play smoke effect if touching the ground
                my.vfx.walking.start();
            }
        } else {
            //Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop(); //Have the vfx stop playing
        }
            
        //Player jump
        //Note: need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && 
        (Phaser.Input.Keyboard.JustDown(cursors.up) || Phaser.Input.Keyboard.JustDown(this.spaceKey))) { //Space or up arrow key pressed
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        //TODO: Reset time when scene is restarted
        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }

    //Updates timer bar
    displayTimeRemaining(currTime) {
        //var time = Math.floor(game.time.totalElapsedSeconds());
        var time = Math.floor(currTime/1000); //Convert time from milliseconds to seconds
        var timeLeft = timeLimit - time;
    
        // detect when countdown is over
        if (timeLeft <= 0) {
            timeLeft = 0;
            timeOver = true;
        }
        this.timeBar.setScale(timeLeft / timeLimit, 1);
    }
}