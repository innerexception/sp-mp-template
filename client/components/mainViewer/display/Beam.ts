import { GameObjects, Physics, } from "phaser";

export default class Beam extends GameObjects.Image {

    xDirection: number
    yDirection: number
    weapon: Weapon
    shooter: Physics.Arcade.Sprite

    constructor(scene, x, y){
        super(scene, x, y, 'lazor')
    }

    fire = (weapon:Weapon, shooter:Physics.Arcade.Sprite) => {
        this.weapon = weapon
        this.shooter = shooter
        this.setPosition(shooter.x, shooter.y); // Initial position
        this.setTexture(weapon.projectileAsset)
        this.setScale(0.2,0.2)
        this.rotation = shooter.rotation

        let targetVector = { x: Math.sin(shooter.rotation), y: Math.cos(shooter.rotation)}
        this.xDirection = targetVector.x
        this.yDirection = -targetVector.y
        this.x += this.xDirection * 50;
        this.y += this.yDirection * 50;

        this.rotation = shooter.rotation; // angle bullet with shooters rotation
    }
    
    overlapObject = (beam:GameObjects.Image, asteroidOrShip:Physics.Arcade.Sprite) => {
        let distance = Phaser.Math.Distance.Between(this.shooter.x, this.shooter.y, asteroidOrShip.x, asteroidOrShip.y)
        this.setDisplaySize(distance, this.displayHeight)
    }

    update = (time, delta) =>{
        this.rotation = this.shooter.rotation
    }
}


