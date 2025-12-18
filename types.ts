
export interface GameState {
  score: number;
  missed: number;
  caught: number;
}

export interface GameItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  type: 'COIN_GOLD' | 'COIN_SILVER' | 'GEM' | 'BOMB' | 'BILL' | 'COIN_PLATINUM' | 'FAKE_BOMB' | 'URINE' | 'THUNDER' | 'MULTIPLIER' | 'MYSTERY' | 'CLOCK';
  value: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export type GameMode = 'TIME' | 'SURVIVAL' | 'VERSUS';

export type ItemType = 'CHARACTER' | 'BACKGROUND' | 'DRUG';

export interface StoreItem {
  id: string;
  name: string;
  price: number;
  type: ItemType;
  description: string;
  effect?: string; // For drugs
}

export interface PlayerInventory {
  ownedItems: string[]; // IDs of owned items
  activeCharacter: string;
  activeBackground: string;
  activeDrug: string | null; // One-time use for next game
}
