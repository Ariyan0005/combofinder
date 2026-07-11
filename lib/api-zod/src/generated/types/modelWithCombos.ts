import type { Compatibility } from './compatibility';

export interface ModelWithCompatibilities {
  id: number;
  brandId: number;
  brandName: string;
  name: string;
  releaseYear?: number | null;
  imageUrl?: string | null;
  combos: Compatibility[];
  createdAt: Date;
}

// Backward-compat alias
export type ModelWithCombos = ModelWithCompatibilities;
