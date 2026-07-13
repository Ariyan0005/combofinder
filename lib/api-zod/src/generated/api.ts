/**
 * ComboFinder API — Zod validation schemas
 * Updated: combos → compatibilities; categories added; priceRange/inStock removed from compatibility schemas
 */
import * as zod from 'zod';

// ── Health ────────────────────────────────────────────────────────────────────
export const HealthCheckResponse = zod.object({
  "status": zod.string()
})

// ── Stats ─────────────────────────────────────────────────────────────────────
export const GetStatsResponse = zod.object({
  "totalBrands": zod.number(),
  "totalModels": zod.number(),
  "totalCombos": zod.number(),
  "totalCompatibilities": zod.number().optional(),
})

// ── Search ────────────────────────────────────────────────────────────────────
export const SearchModelsQueryParams = zod.object({
  "q": zod.coerce.string().optional(),
  "brand_id": zod.coerce.number().optional(),
  "category_id": zod.coerce.number().optional()
})

export const SearchModelsResponse = zod.object({
  "brands": zod.array(zod.object({
    "id": zod.number(),
    "name": zod.string(),
    "logoUrl": zod.string().nullish(),
    "modelCount": zod.number(),
    "createdAt": zod.coerce.date()
  })),
  "models": zod.array(zod.object({
    "id": zod.number(),
    "brandId": zod.number(),
    "brandName": zod.string(),
    "name": zod.string(),
    "releaseYear": zod.number().nullish(),
    "imageUrl": zod.string().nullish(),
    "comboCount": zod.number(),
    "createdAt": zod.coerce.date()
  }))
})

// ── Categories ────────────────────────────────────────────────────────────────
export const GetCategoriesResponseItem = zod.object({
  "id": zod.number(),
  "name": zod.string(),
  "slug": zod.string(),
  "icon": zod.string().nullish(),
  "sortOrder": zod.number(),
  "brandCount": zod.number(),
  "createdAt": zod.coerce.date()
})
export const GetCategoriesResponse = zod.array(GetCategoriesResponseItem)

export const GetCategoryParams = zod.object({ "id": zod.coerce.number() })

export const CreateCategoryBody = zod.object({
  "name": zod.string(),
  "slug": zod.string(),
  "icon": zod.string().nullish(),
  "sortOrder": zod.number().optional()
})

export const UpdateCategoryParams = zod.object({ "id": zod.coerce.number() })
export const UpdateCategoryBody = zod.object({
  "name": zod.string().optional(),
  "slug": zod.string().optional(),
  "icon": zod.string().nullish(),
  "sortOrder": zod.number().optional()
})

export const DeleteCategoryParams = zod.object({ "id": zod.coerce.number() })

// ── Brands ────────────────────────────────────────────────────────────────────
export const GetBrandsResponseItem = zod.object({
  "id": zod.number(),
  "categoryId": zod.number().nullish(),
  "name": zod.string(),
  "logoUrl": zod.string().nullish(),
  "modelCount": zod.number(),
  "createdAt": zod.coerce.date()
})
export const GetBrandsResponse = zod.array(GetBrandsResponseItem)

export const CreateBrandBody = zod.object({
  "name": zod.string(),
  "logoUrl": zod.string().nullish(),
  "categoryId": zod.number().nullish()
})

export const GetBrandParams = zod.object({ "id": zod.coerce.number() })
export const GetBrandResponse = zod.object({
  "id": zod.number(),
  "categoryId": zod.number().nullish(),
  "name": zod.string(),
  "logoUrl": zod.string().nullish(),
  "modelCount": zod.number(),
  "createdAt": zod.coerce.date()
})

export const UpdateBrandParams = zod.object({ "id": zod.coerce.number() })
export const UpdateBrandBody = zod.object({
  "name": zod.string(),
  "logoUrl": zod.string().nullish(),
  "categoryId": zod.number().nullish()
})
export const UpdateBrandResponse = GetBrandResponse

export const DeleteBrandParams = zod.object({ "id": zod.coerce.number() })
export const DeleteBrandResponse = zod.object({ "success": zod.boolean() })

export const GetBrandModelsParams = zod.object({ "id": zod.coerce.number() })
export const GetBrandModelsResponseItem = zod.object({
  "id": zod.number(),
  "brandId": zod.number(),
  "brandName": zod.string(),
  "name": zod.string(),
  "releaseYear": zod.number().nullish(),
  "imageUrl": zod.string().nullish(),
  "comboCount": zod.number(),
  "createdAt": zod.coerce.date()
})
export const GetBrandModelsResponse = zod.array(GetBrandModelsResponseItem)

// ── Models ────────────────────────────────────────────────────────────────────
export const GetModelsQueryParams = zod.object({
  "brand_id": zod.coerce.number().optional()
})

export const GetModelsResponseItem = zod.object({
  "id": zod.number(),
  "brandId": zod.number(),
  "brandName": zod.string(),
  "name": zod.string(),
  "releaseYear": zod.number().nullish(),
  "imageUrl": zod.string().nullish(),
  "comboCount": zod.number(),
  "createdAt": zod.coerce.date()
})
export const GetModelsResponse = zod.array(GetModelsResponseItem)

export const CreateModelBody = zod.object({
  "brandId": zod.number(),
  "name": zod.string(),
  "releaseYear": zod.number().nullish(),
  "imageUrl": zod.string().nullish()
})

// Compatibility shape (no priceRange, no inStock)
const CompatibilityShape = zod.object({
  "id": zod.number(),
  "modelId": zod.number(),
  "modelName": zod.string(),
  "brandName": zod.string(),
  "name": zod.string(),
  "comboType": zod.enum(['OEM', 'Compatible', 'Refurbished']),
  "qualityGrade": zod.string().nullish(),
  "notes": zod.string().nullish(),
  "createdAt": zod.coerce.date()
})

export const GetModelParams = zod.object({ "id": zod.coerce.number() })
export const GetModelResponse = zod.object({
  "id": zod.number(),
  "brandId": zod.number(),
  "brandName": zod.string(),
  "name": zod.string(),
  "releaseYear": zod.number().nullish(),
  "imageUrl": zod.string().nullish(),
  "combos": zod.array(CompatibilityShape),
  "createdAt": zod.coerce.date()
})

export const UpdateModelParams = zod.object({ "id": zod.coerce.number() })
export const UpdateModelBody = zod.object({
  "brandId": zod.number(),
  "name": zod.string(),
  "releaseYear": zod.number().nullish(),
  "imageUrl": zod.string().nullish()
})
export const UpdateModelResponse = zod.object({
  "id": zod.number(),
  "brandId": zod.number(),
  "brandName": zod.string(),
  "name": zod.string(),
  "releaseYear": zod.number().nullish(),
  "imageUrl": zod.string().nullish(),
  "comboCount": zod.number(),
  "createdAt": zod.coerce.date()
})

export const DeleteModelParams = zod.object({ "id": zod.coerce.number() })
export const DeleteModelResponse = zod.object({ "success": zod.boolean() })

// ── Compatibilities (formerly Combos) ────────────────────────────────────────
export const GetModelCombosParams = zod.object({ "id": zod.coerce.number() })
export const GetModelCombosResponseItem = CompatibilityShape
export const GetModelCombosResponse = zod.array(GetModelCombosResponseItem)

export const GetCombosQueryParams = zod.object({
  "model_id": zod.coerce.number().optional()
})
// Alias
export const GetCompatibilitiesQueryParams = GetCombosQueryParams

export const GetCombosResponseItem = CompatibilityShape
export const GetCombosResponse = zod.array(GetCombosResponseItem)

export const CreateComboBody = zod.object({
  "modelId": zod.number(),
  "name": zod.string(),
  "comboType": zod.enum(['OEM', 'Compatible', 'Refurbished']),
  "qualityGrade": zod.string().nullish(),
  "notes": zod.string().nullish(),
})
// Alias
export const CreateCompatibilityBody = CreateComboBody

export const BulkCreateCompatibilitiesBody = zod.object({
  "modelId": zod.number(),
  "comboType": zod.enum(['OEM', 'Compatible', 'Refurbished']),
  "names": zod.array(zod.string().min(1)).min(1),
})

export const GetComboParams = zod.object({ "id": zod.coerce.number() })
export const GetComboResponse = CompatibilityShape
export const GetCompatibilityParams = GetComboParams

export const UpdateComboParams = zod.object({ "id": zod.coerce.number() })
export const UpdateCompatibilityParams = UpdateComboParams

export const UpdateComboBody = zod.object({
  "modelId": zod.number().optional(),
  "name": zod.string().optional(),
  "comboType": zod.enum(['OEM', 'Compatible', 'Refurbished']).optional(),
  "qualityGrade": zod.string().nullish(),
  "notes": zod.string().nullish(),
})
export const UpdateCompatibilityBody = UpdateComboBody

export const UpdateComboResponse = CompatibilityShape
export const DeleteComboParams = zod.object({ "id": zod.coerce.number() })
export const DeleteCompatibilityParams = DeleteComboParams
export const DeleteComboResponse = zod.object({ "success": zod.boolean() })
