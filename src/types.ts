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
  tilesFrom: number[]; tilesTo: number[];
  operator1: Operator; operator2: Operator;
  id: number;
}

export type Mode = 'default' | 'singleArrow' | 'branchedArrow1' | 'branchedArrow2';

export class TileSelection {
  tilesFrom: number[];
  tilesTo: number[];
  constructor() {
    this.tilesFrom = [];
    this.tilesTo = [];
  }
}
