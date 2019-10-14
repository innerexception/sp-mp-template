const star = require('./star/g0.png')
const star2 = require('./star/a0.png')
const ship = require('./ship/aerie.png')
const planet = require('./planet/callisto.png')
const asteroid1 = require('./asteroid/iron/spin-00.png')
const asteroid2 = require('./asteroid/lead/spin-00.png')
const lazor = require('./projectile/laser+0.png')
const boom = require('./explosion.png')
const proton = require('./projectile/proton+.png')
const sparrow = require('./projectile/javelin.png') 
const target = require('./crosshair.png')
const shield = require('./spr_shield.png')
const warp = require('./warp.png')


export const defaults = [
    { key: 'star', resource: star, type: 'image' },
    { key: 'bigStar', resource: star2, type: 'image' },
    { key: 'planet', resource: planet, type: 'image' },
    { key: 'Iron', resource: asteroid1, type: 'image' },
    { key: 'Silver', resource: asteroid2, type: 'image' },
    { key: 'lazor', resource: lazor, type: 'image' },
    { key: 'ship', resource: ship, type: 'image' },
    { key: 'boom', resource: boom, type: 'spritesheet', data:  { frameWidth: 64, frameHeight: 64 } },
    { key: 'proton', resource: proton, type: 'image' },
    { key: 'sparrow', resource: sparrow, type: 'image' },
    { key: 'target', resource: target, type: 'image' },
    { key: 'shield', resource: shield, type: 'image' },
    { key: 'warp', resource: warp, type: 'spritesheet', data: { frameWidth: 320, frameHeight: 320 }},
]