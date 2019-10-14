const DIRS = {
	4: [[0, -1], [1, 0], [0, 1], [-1, 0]],
	8: [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]],
	6: [[-1, -1], [1, -1], [2, 0], [1, 1], [-1, 1], [-2, 0]]
};

export type ComputeCallback = (x: number, y: number) => any;
export type PassableCallback = (x: number, y: number) => boolean;

export interface Options {
	topology: 4 | 6 | 8;
}

/**
 * @class Abstract pathfinder
 * @param {int} toX Target X coord
 * @param {int} toY Target Y coord
 * @param {function} passableCallback Callback to determine map passability
 * @param {object} [options]
 * @param {int} [options.topology=8]
 */

abstract class Path {
	_toX: number;
	_toY: number;
	_passableCallback: PassableCallback;
	_options: Options;
	_dirs: number[][];

	constructor(toX: number, toY: number, passableCallback: PassableCallback, options: Partial<Options> = {}) {
		this._toX = toX;
		this._toY = toY;
		this._passableCallback = passableCallback;
		this._options = Object.assign({
			topology: 8
		}, options);

		this._dirs = DIRS[this._options.topology];
		if (this._options.topology == 8) { /* reorder dirs for more aesthetic result (vertical/horizontal first) */
			this._dirs = [
				this._dirs[0],
				this._dirs[2],
				this._dirs[4],
				this._dirs[6],
				this._dirs[1],
				this._dirs[3],
				this._dirs[5],
				this._dirs[7]
			]
		}
	}

	/**
	 * Compute a path from a given point
	 * @param {int} fromX
	 * @param {int} fromY
	 * @param {function} callback Will be called for every path item with arguments "x" and "y"
	 */
	abstract compute(fromX: number, fromY: number, callback: ComputeCallback): void;

	_getNeighbors(cx: number, cy: number) {
		let result = [];
		for (let i=0;i<this._dirs.length;i++) {
			let dir = this._dirs[i];
			let x = cx + dir[0];
			let y = cy + dir[1];
			
			if (!this._passableCallback(x, y)) { continue; }
			result.push([x, y]);
		}
		
		return result;
	}
}

interface Item {
	x: number;
	y: number;
	g: number;
	h: number;
	prev: Item | null;
}

/**
 * @class Simplified A* algorithm: all edges have a value of 1
 */
export default class AStar extends Path {
	_todo: Item[];
	_done: {[key:string]: Item};
	_fromX!: number;
	_fromY!: number;

	constructor(toX: number, toY: number, passableCallback: PassableCallback, options: Partial<Options> = {}) {
		super(toX, toY, passableCallback, options);

		this._todo = [];
		this._done = {};
	}

	/**
	 * Compute a path from a given point
	 * @see ROT.Path#compute
	 */
	compute(fromX: number, fromY: number) {
		this._todo = [];
		this._done = {};
		this._fromX = fromX;
		this._fromY = fromY;
        this._add(this._toX, this._toY, null);
        let coords = []

		while (this._todo.length) {
			let item = this._todo.shift() as Item;
			let id = item.x+","+item.y;
			if (id in this._done) { continue; }
			this._done[id] = item;
			if (item.x == fromX && item.y == fromY) { break; }

			let neighbors = this._getNeighbors(item.x, item.y);

			for (let i=0;i<neighbors.length;i++) {
				let neighbor = neighbors[i];
				let x = neighbor[0];
				let y = neighbor[1];
				let id = x+","+y;
				if (id in this._done) { continue; }
				this._add(x, y, item); 
			}
		}
		
		let item: Item | null = this._done[fromX+","+fromY];
		if (!item) { return; }
		
		while (item) {
			coords.push({x:item.x, y:item.y});
			item = item.prev;
        }
        coords.shift()
        return coords
	}

	_add(x: number, y: number, prev: Item | null) {
		let h = this._distance(x, y);
		let obj = {
			x: x,
			y: y,
			prev: prev,
			g: (prev ? prev.g+1 : 0),
			h: h
		};
		
		/* insert into priority queue */
		
		let f = obj.g + obj.h;
		for (let i=0;i<this._todo.length;i++) {
			let item = this._todo[i];
			let itemF = item.g + item.h;
			if (f < itemF || (f == itemF && h < item.h)) {
				this._todo.splice(i, 0, obj);
				return;
			}
		}
		
		this._todo.push(obj);
	}

	_distance(x: number, y: number) {
		switch (this._options.topology) {
			case 4:
				return (Math.abs(x-this._fromX) + Math.abs(y-this._fromY));
			break;

			case 6:
				let dx = Math.abs(x - this._fromX);
				let dy = Math.abs(y - this._fromY);
				return dy + Math.max(0, (dx-dy)/2);
			break;

			case 8: 
				return Math.max(Math.abs(x-this._fromX), Math.abs(y-this._fromY));
			break;
		}
	}
}