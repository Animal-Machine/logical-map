import { Data } from './types';


export interface TileXY extends Data {
  x: number; y: number;
}

export interface TileZ extends Data {
  z: number;
}

export interface TileContent extends Data {
  text: string; truthValue: boolean|null;
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
