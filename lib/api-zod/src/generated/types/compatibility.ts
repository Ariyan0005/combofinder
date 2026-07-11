/**
 * Compatibility type (renamed from Combo).
 * priceRange and inStock removed — pure reference data only.
 */
import type { ComboComboType } from './comboComboType';

export interface Compatibility {
  id: number;
  modelId: number;
  modelName: string;
  brandName: string;
  name: string;
  comboType: ComboComboType;
  qualityGrade?: string | null;
  notes?: string | null;
  createdAt: Date;
}

// Backward-compat alias
export type Combo = Compatibility;
