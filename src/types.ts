export type Address = "tiles" | "arrows";

export interface TileData {
  text: string; truthValue: boolean|null;
  x: number; y: number; z: number;
  id: number;
}

export interface TileContent {
  text: string; truthValue: boolean|null;
  id: number;
}

export interface TileXY {
  x: number; y: number;
  id: number;
}

export interface TileZ {
  z: number;
  id: number;
}

export type Operator = '' | 'NOT' | 'AND' | 'OR';

export interface Arrow {
  tileFrom: number[]; tileTo: number[];
  operator1: Operator; operator2: Operator;
  id: number;
}

export interface Point {
  x: number; y: number;
}

export interface Rectangle extends Point {
  w: number; h: number;
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
