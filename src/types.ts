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

export interface TileCoords {
  x: number; y: number; z: number;
  id: number;
}

export interface Arrow {
  from: number; to: number;
  id: number;
}

export interface ArrowCoords {
  coords: DoubleCoords;
  highlight: boolean;
  id: number;
}

export interface Point {
  x:number; y:number;
}

export interface Rectangle {
  x:number; y:number; w:number; h:number;
}

export type DoubleCoords = [number, number, number, number];
