/**
 * CreateCompatibilityInput (renamed from CreateComboInput).
 * priceRange and inStock removed.
 */
import type { CreateComboInputComboType } from './createComboInputComboType';

export interface CreateCompatibilityInput {
  modelId: number;
  name: string;
  comboType: CreateComboInputComboType;
  qualityGrade?: string | null;
  notes?: string | null;
}

// Backward-compat alias
export type CreateComboInput = CreateCompatibilityInput;
