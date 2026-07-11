/**
 * ComboFinder API schemas
 * Updated: combos → compatibilities; categories added; priceRange/inStock removed
 */
export interface HealthStatus {
  status: string;
}

export interface Stats {
  totalBrands: number;
  totalModels: number;
  totalCombos: number;           // kept for backward compat
  totalCompatibilities: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  sortOrder: number;
  brandCount: number;
  createdAt: string;
}

export interface Brand {
  id: number;
  categoryId?: number | null;
  name: string;
  logoUrl?: string | null;
  modelCount: number;
  createdAt: string;
}

export interface CreateBrandInput {
  name: string;
  logoUrl?: string | null;
  categoryId?: number | null;
}

export interface Model {
  id: number;
  brandId: number;
  brandName: string;
  name: string;
  releaseYear?: number | null;
  imageUrl?: string | null;
  comboCount: number;
  createdAt: string;
}

export type ComboComboType = typeof ComboComboType[keyof typeof ComboComboType];
export const ComboComboType = {
  OEM: 'OEM',
  Compatible: 'Compatible',
  Refurbished: 'Refurbished',
} as const;

// Compatibility (renamed from Combo) — no priceRange, no inStock
export interface Combo {
  id: number;
  modelId: number;
  modelName: string;
  brandName: string;
  name: string;
  comboType: ComboComboType;
  qualityGrade?: string | null;
  notes?: string | null;
  createdAt: string;
}
// Alias for new code
export type Compatibility = Combo;

export interface ModelWithCombos {
  id: number;
  brandId: number;
  brandName: string;
  name: string;
  releaseYear?: number | null;
  imageUrl?: string | null;
  combos: Combo[];
  createdAt: string;
}
export type ModelWithCompatibilities = ModelWithCombos;

export interface CreateModelInput {
  brandId: number;
  name: string;
  releaseYear?: number | null;
  imageUrl?: string | null;
}

export type CreateComboInputComboType = typeof CreateComboInputComboType[keyof typeof CreateComboInputComboType];
export const CreateComboInputComboType = {
  OEM: 'OEM',
  Compatible: 'Compatible',
  Refurbished: 'Refurbished',
} as const;

export interface CreateComboInput {
  modelId: number;
  name: string;
  comboType: CreateComboInputComboType;
  qualityGrade?: string | null;
  notes?: string | null;
}
export type CreateCompatibilityInput = CreateComboInput;

export interface SearchResults {
  brands: Brand[];
  models: Model[];
}

export interface SuccessResponse {
  success: boolean;
}

export interface ErrorResponse {
  error: string;
}

export type SearchModelsParams = {
  q?: string;
  brand_id?: number;
};

export type GetModelsParams = {
  brand_id?: number;
};

export type GetCombosParams = {
  model_id?: number;
};
export type GetCompatibilitiesParams = GetCombosParams;
