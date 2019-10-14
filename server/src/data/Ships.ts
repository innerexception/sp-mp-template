import { ProtonGun, LaserCannon, Sparrow } from "./Weapons";
import { FactionName } from "../../../enum";

export const Shuttle:ShipData = {
    name: 'Shuttle',
    id:'',
    ownerId: '',
    faction: FactionName.NEUTRAL,
    shields: 10,
    maxShields: 10,
    armor: 0,
    hull: 10,
    maxHull: 10,
    fuel: 3,
    maxFuel: 3,
    energy: 5,
    maxEnergy: 5,
    heat: 5,
    maxHeat: 5,
    fighters: [],
    killedIds: [],
    turn: 0.05,
    accel: 100,
    speed: 0,
    maxSpeed: 200,
    maxCargoSpace: 20,
    gunMounts: 1,
    turrentMounts: 0,
    hardPoints: 0,
    weapons: [ProtonGun, Sparrow],
    selectedWeaponIndex: 0,
    currentTargetId: '',
    asset: 'ship',
    cargo: [],
    systemName: 'Rigel',
    transientData: {},
    aiProfile: null
}

export const Ships = [Shuttle]