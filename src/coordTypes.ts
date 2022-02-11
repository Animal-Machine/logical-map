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
  coords: DoubleCoords | CoordsOrArray[];
  highlight: boolean;
  id: number;
}
