export class Point {
  x: number;
  y: number;
  constructor() {
    this.x = 0;
    this.y = 0;
  }
}

export class Rectangle extends Point {
  w: number;
  h: number;
  constructor() {
    super();
    this.w = 0;
    this.h = 0;
  }
}

export interface PointOrRectangle extends Point {
  w?: number; h?: number;
}

export type Coords = [number, number];
export function isCoords(array: CoordsOrArray): array is Coords {
  return (array.length === 2 && typeof array[0] === "number" && typeof array[1] === "number");
}

export type DoubleCoords = [number, number, number, number];
export function isDoubleCoords(array: Array<any>): array is DoubleCoords {
  return(array.length === 4 && array.every(c => typeof c === 'number'));
}

export type CoordsOrArray = Coords | CoordsOrArray[];

type recursiveNumber = number | recursiveNumber[];
let a: recursiveNumber = [1, 2, 3];
let b: recursiveNumber = 3;
let c: recursiveNumber = [1, 2, [3, 4]];

export interface ArrowCoords {
  id: number;
  coords: CoordsOrArray[];
  deleteButtonCoords: Coords;
  highlight: boolean;
}

export function meanCoords(coords: Coords[], weights: number[] = []) {
  // weighted mean between elements of type Coords
  let coordSum: Coords = [0, 0];
  let defaultWeight = 1/coords.length;
    for (let i = 0; i < coords.length; i++) {
      let w = (i < weights.length) ? weights[i] : defaultWeight;
      coordSum[0] += w * coords[i][0];
      coordSum[1] += w * coords[i][1];
    }
  return coordSum;
}

export function distInfCoords(a: Coords, b: Coords) {
  return Math.max(Math.abs(a[0]-b[0]), Math.abs(a[1]-b[1]));
}
