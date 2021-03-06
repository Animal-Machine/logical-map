import { Data } from './types';
import { Coords, CoordsOrArray } from './graphDrawing';


export type Operator = '' | 'NOT' | 'AND' | 'OR';

export interface ArrowData extends Data {
  tilesFrom: number[]; tilesTo: number[];
  operator1: Operator; operator2: Operator;
}

export type AddArrow = (a: number | number[], b: number | number[], operator1?: Operator, operator2?: Operator) => void

export type Mode = 'default' | 'singleArrow' | 'branchedArrow1' | 'branchedArrow2';


export interface ArrowCoords extends Data {
  coords: CoordsOrArray[];
  deleteButtonCoords: Coords;
}

export interface ArrowProps extends ArrowCoords {
  highlightedByDrawing: boolean;
  highlightedByButton:  boolean;
}

export interface ArrowHighlight extends Data {
  highlightedByDrawing: boolean;
  highlightedByButton:  boolean;
}

export type HighlightMethod = "drawing" | "button";

export type SwitchHighlight = (id: number, value: boolean, method: HighlightMethod) => void;
