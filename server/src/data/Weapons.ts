import { WeaponType } from "../../../enum";

export const ProtonGun:Weapon = {
    name: 'Proton Gun',
    type: WeaponType.Energy,
    energyPerShot: 1,
    heatPerShot: 0,
    projectileSpeed: 25,
    accuracy: 1,
    shotsPerSecond: 3,
    isTurrent: true,
    shieldDamage: 1,
    armorDamage: 0.5,
    projectileAsset: 'proton',
    range: 300,
    isBeam: false,
    shipId: '',
    isGuided: false,
    projectileSize: 0.2
}

export const LaserCannon:Weapon = {
    name: 'Laser Cannon',
    type: WeaponType.Energy,
    energyPerShot: 1,
    heatPerShot: 0,
    projectileSpeed: 50,
    accuracy: 1,
    isBeam: true,
    isTurrent: false,
    shieldDamage: 0.1,
    armorDamage: 0.1,
    projectileAsset: 'lazor',
    range: 200,
    shipId: '',
    isGuided: false,
    shotsPerSecond: 0.5,
    projectileSize: 0.2
}

export const Sparrow:Weapon = {
    name: 'Sparrow Missile',
    type: WeaponType.Kinetic,
    energyPerShot: 0,
    heatPerShot: 0,
    projectileSpeed: 10,
    accuracy: 1,
    isBeam: false,
    isTurrent: false,
    shieldDamage: 10,
    armorDamage: 10,
    projectileAsset: 'sparrow',
    projectileTrackingInterval: 200,
    projectileTurnSpeed: 0.2,
    range: 2000,
    shipId: '',
    isGuided: true,
    shotsPerSecond: 1,
    projectileSize: 0.4
}

export const Weapons:Array<Weapon> = [ProtonGun, LaserCannon, Sparrow]