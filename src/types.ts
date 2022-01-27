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

export interface Arrow {
  from: number; to: number;
  id: number;
}

export interface Point {
  x: number; y: number;
}

export interface Rectangle {
  x: number; y: number; w: number; h: number;
}

export type DoubleCoords = [number, number, number, number];

export interface ArrowCoords {
  coords: DoubleCoords;
  highlight: boolean;
  id: number;
}

export type Coords = [number, number];

export type CoordsOrArray = Coords | CoordsOrArray[];

export function isCoords(array: CoordsOrArray): array is Coords {
  return (array.length === 2 && typeof array[0] === "number" && typeof array[1] === "number");
}

type recursiveNumber = number | recursiveNumber[];
let a: recursiveNumber = [1, 2, 3];
let b: recursiveNumber = 3;
let c: recursiveNumber = [1, 2, [3, 4]];
