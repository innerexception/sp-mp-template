import { Metals } from "../../../enum";

export default {
    Metals: [
        { name: Metals.COPPER, price: 5},
        { name: Metals.GOLD, price: 50},
        { name: Metals.IRON, price: 3},
        { name: Metals.PLATINUM, price: 100},
        { name: Metals.SILVER, price: 20},
    ] as Array<Commodity>,
    Agriculture: [
        { name: 'Corn', price: 3}
    ] as Array<Commodity>,
    Manufactured: [
        { name: 'Transformers', price: 32}
    ] as Array<Commodity>,
}