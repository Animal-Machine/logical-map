export type Address = "tiles" | "arrows";

export interface TileXY {
  x: number; y: number;
  id: number;
}

export interface TileZ {
  z: number;
  id: number;
}

export interface TileContent {
  text: string; truthValue: boolean|null;
  id: number;
}

export interface TileDataPart {
  text: string; truthValue: boolean|null;
  x: number; y: number;
}

export interface TileData extends TileDataPart, TileZ {}

export class TileSelection {
  tilesFrom: number[];
  tilesTo: number[];
  constructor() {
    this.tilesFrom = [];
    this.tilesTo = [];
  }
}

export type UpdateTruthValue = (id: number, value: boolean|null) => void
