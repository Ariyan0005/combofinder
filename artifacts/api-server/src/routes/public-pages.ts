import { Router } from "express";
import { and, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import {
  batteryCompatibilityTable,
  batteryModelsTable,
  brandsTable,
  categoriesTable,
  compatibilitiesTable,
  db,
  modelsTable,
  schematicsTable,
} from "@workspace/db";

import { slugify } from "../lib/slug";

const router = Router();

const brandSlugExpression = sql<string>`
  regexp_replace(
    regexp_replace(lower(trim(${brandsTable.name})), '[^a-z0-9]+', '-', 'g'),
    '(^-|-$)', '', 'g'
  )
`;
const modelSlugExpression = sql<string>`
  regexp_replace(
    regexp_replace(lower(trim(${modelsTable.name})), '[^a-z0-9]+', '-', 'g'),
    '(^-|-$)', '', 'g'
  )
`;

function canonicalOrigin(req: { protocol: string; get(name: string): string | undefined }): string {
  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || req.protocol;
  return `${protocol}://${req.get("host") ?? "localhost"}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function publicTechnicalPath(row: { id: number; slug: string | null; schematicType: string | null }): string | null {
  if (!row.slug) return null;
  return row.schematicType === "ISP Pinout" ? `/isp-pinout/${row.slug}` : `/test-point/${row.slug}`;
}

// Helper to deduce brand and model name from arbitrary name string
function parseBrandAndModel(name: string, fallbackBrandName: string = ""): { brandName: string; modelName: string; brandSlug: string; modelSlug: string; slugUrl: string } {
  const trimmed = name.trim();
  const brands = [
    "Samsung", "Apple", "Xiaomi", "Redmi", "Poco", "Oppo", "Realme", "Vivo", "IQOO",
    "OnePlus", "Huawei", "Honor", "Google", "Motorola", "Infinix", "Tecno", "Itel",
    "Nokia", "Sony", "Asus", "ZTE", "LG"
  ];

  let detectedBrand = fallbackBrandName || "Generic";
  let detectedModel = trimmed;

  for (const b of brands) {
    if (trimmed.toLowerCase().startsWith(b.toLowerCase() + " ") || trimmed.toLowerCase() === b.toLowerCase()) {
      detectedBrand = b;
      detectedModel = trimmed.slice(b.length).trim() || trimmed;
      break;
    }
  }

  const bSlug = slugify(detectedBrand);
  const mSlug = slugify(detectedModel);
  return {
    brandName: detectedBrand,
    modelName: detectedModel,
    brandSlug: bSlug,
    modelSlug: mSlug,
    slugUrl: `/compatibility/${bSlug}/${mSlug}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 0. GET /public/model-by-id/:id — Resolves legacy /models/:id to SEO slug URL
// ─────────────────────────────────────────────────────────────────────────────
router.get("/public/model-by-id/:id", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid model ID" });
      return;
    }

    const [model] = await db
      .select({
        id: modelsTable.id,
        name: modelsTable.name,
        brandId: brandsTable.id,
        brandName: brandsTable.name,
        categoryName: categoriesTable.name,
        categorySlug: categoriesTable.slug,
      })
      .from(modelsTable)
      .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
      .leftJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
      .where(eq(modelsTable.id, id));

    if (!model) {
      res.status(404).json({ error: "Model not found" });
      return;
    }

    const brandSlug = slugify(model.brandName);
    const modelSlug = slugify(model.name);
    const canonicalPath = `/compatibility/${brandSlug}/${modelSlug}`;

    res.json({
      id: model.id,
      name: model.name,
      brandName: model.brandName,
      brandSlug,
      modelSlug,
      categoryName: model.categoryName,
      categorySlug: model.categorySlug,
      canonicalPath,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /public/compatibility — Public Catalog & Search Directory
// ─────────────────────────────────────────────────────────────────────────────
router.get("/public/compatibility", async (req, res): Promise<void> => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : "";
    const categoryFilter = req.query.category ? String(req.query.category).trim() : "";

    const [allBrands, allCategories, rawModels] = await Promise.all([
      db
        .select({ id: brandsTable.id, name: brandsTable.name, categoryId: brandsTable.categoryId })
        .from(brandsTable)
        .orderBy(brandsTable.name),
      db
        .select({ id: categoriesTable.id, name: categoriesTable.name, slug: categoriesTable.slug })
        .from(categoriesTable)
        .orderBy(categoriesTable.name),
      db
        .select({
          id: modelsTable.id,
          name: modelsTable.name,
          imageUrl: modelsTable.imageUrl,
          brandId: brandsTable.id,
          brandName: brandsTable.name,
          categoryId: categoriesTable.id,
          categoryName: categoriesTable.name,
          categorySlug: categoriesTable.slug,
          compatCount: sql<number>`count(${compatibilitiesTable.id}) filter (where ${compatibilitiesTable.isPublished} = true)::int`,
        })
        .from(modelsTable)
        .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
        .leftJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
        .leftJoin(compatibilitiesTable, eq(compatibilitiesTable.modelId, modelsTable.id))
        .groupBy(modelsTable.id, brandsTable.id, categoriesTable.id)
        .orderBy(brandsTable.name, modelsTable.name),
    ]);

    let filtered = rawModels.map(m => {
      const bSlug = slugify(m.brandName);
      const mSlug = slugify(m.name);
      return {
        ...m,
        brandSlug: bSlug,
        modelSlug: mSlug,
        slugUrl: `/compatibility/${bSlug}/${mSlug}`,
      };
    });

    if (categoryFilter) {
      filtered = filtered.filter(m =>
        (m.categorySlug ?? "").toLowerCase() === categoryFilter.toLowerCase() ||
        (m.categoryName ?? "").toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    if (q) {
      const lowerQ = q.toLowerCase();
      // Extract model tokens by stripping generic hardware terms: "lcd", "combo", "folder", "display", "screen", "compatibility"
      const stopWords = new Set(["lcd", "combo", "folder", "display", "screen", "compatibility", "compatible", "phone", "mobile", "glass", "touch", "price", "replacement"]);
      const rawTokens = lowerQ.split(/[\s\-_\/]+/).filter(Boolean);
      const searchTokens = rawTokens.filter(t => !stopWords.has(t));
      const effectiveTokens = searchTokens.length > 0 ? searchTokens : rawTokens;

      filtered = filtered.filter(m => {
        const full = `${m.brandName} ${m.name}`.toLowerCase();
        const modelName = m.name.toLowerCase();
        const brandName = m.brandName.toLowerCase();

        // 1. Direct substring match
        if (full.includes(lowerQ) || modelName.includes(lowerQ) || brandName.includes(lowerQ)) {
          return true;
        }

        // 2. Token match: all effective tokens must appear in brand or model name
        return effectiveTokens.every(token => full.includes(token));
      });
    }

    res.json({
      brands: allBrands.map(b => ({
        id: b.id,
        name: b.name,
        slug: slugify(b.name),
      })),
      categories: allCategories,
      models: filtered,
      totalCount: filtered.length,
    });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to fetch compatibility directory" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /public/compatibility/:brandSlug/:modelSlug — Dedicated Model Compatibility
// ─────────────────────────────────────────────────────────────────────────────
router.get("/public/compatibility/:brandSlug/:modelSlug", async (req, res): Promise<void> => {
  try {
    const brandSlug = String(req.params.brandSlug).toLowerCase();
    const modelSlug = String(req.params.modelSlug).toLowerCase();

    // 1. Try to find the model in modelsTable
    let [model] = await db
      .select({
        id: modelsTable.id,
        name: modelsTable.name,
        imageUrl: modelsTable.imageUrl,
        brandId: brandsTable.id,
        brandName: brandsTable.name,
        categoryId: categoriesTable.id,
        categoryName: categoriesTable.name,
        categorySlug: categoriesTable.slug,
      })
      .from(modelsTable)
      .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
      .leftJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
      .where(and(sql`${brandSlugExpression} = ${brandSlug}`, sql`${modelSlugExpression} = ${modelSlug}`))
      .limit(1);

    // 1b. Try flexible prefix-stripped matching on modelsTable
    // e.g., if user searches "a12" or "galaxy-a12"
    if (!model) {
      const brandModels = await db
        .select({
          id: modelsTable.id,
          name: modelsTable.name,
          imageUrl: modelsTable.imageUrl,
          brandId: brandsTable.id,
          brandName: brandsTable.name,
          categoryId: categoriesTable.id,
          categoryName: categoriesTable.name,
          categorySlug: categoriesTable.slug,
        })
        .from(modelsTable)
        .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
        .leftJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
        .where(sql`${brandSlugExpression} = ${brandSlug}`);

      const matched = brandModels.find(m => {
        const fullSlug = slugify(m.name);
        if (fullSlug === modelSlug) return true;
        // Strip common prefixes: "Galaxy ", "Redmi ", "Mi ", "Poco ", "iPhone ", etc.
        const strippedName = m.name.replace(/^(Galaxy|Redmi|Mi|Poco|iPhone|Note|Oppo|Vivo|Realme|Infinix|Tecno|Itel|Motorola|Huawei|Honor|Nokia)\s+/i, "");
        const strippedSlug = slugify(strippedName);
        if (strippedSlug === modelSlug) return true;
        // Check if modelSlug is a normalized subset
        const cleanModelSlug = modelSlug.replace(/-(lcd|combo|folder|display|screen|touch|digitizer)/g, "");
        return fullSlug === cleanModelSlug || strippedSlug === cleanModelSlug;
      });

      if (matched) {
        model = matched;
      }
    }

    // 2. Fallback: If not found by exact slug expressions, try a broader search or check if it exists
    // as a compatible model name in compatibilitiesTable (so all 10 compatible models immediately have their page!)
    if (!model) {
      // Check if this model is listed in compatibilitiesTable under any published model
      const candidateCompats = await db
        .select({
          id: compatibilitiesTable.id,
          name: compatibilitiesTable.name,
          parentModelId: compatibilitiesTable.modelId,
          parentModelName: modelsTable.name,
          parentBrandName: brandsTable.name,
          parentBrandId: brandsTable.id,
          parentCategoryId: categoriesTable.id,
          parentCategoryName: categoriesTable.name,
          parentCategorySlug: categoriesTable.slug,
        })
        .from(compatibilitiesTable)
        .innerJoin(modelsTable, eq(modelsTable.id, compatibilitiesTable.modelId))
        .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
        .leftJoin(categoriesTable, eq(categoriesTable.id, brandsTable.categoryId))
        .where(and(
          eq(compatibilitiesTable.isPublished, true),
          sql`trim(${compatibilitiesTable.name}) <> ''`,
        ));

      const matchedCandidate = candidateCompats.find(c => {
        const parsed = parseBrandAndModel(c.name, c.parentBrandName);
        if (parsed.brandSlug === brandSlug) {
          if (parsed.modelSlug === modelSlug || slugify(c.name) === modelSlug) return true;
          const stripped = parsed.modelName.replace(/^(Galaxy|Redmi|Mi|Poco|iPhone|Note|Oppo|Vivo|Realme|Infinix|Tecno|Itel)\s+/i, "");
          return slugify(stripped) === modelSlug;
        }
        return false;
      });

      if (matchedCandidate) {
        const parsed = parseBrandAndModel(matchedCandidate.name, matchedCandidate.parentBrandName);
        model = {
          id: 0, // Virtual model resolved from compatibility cluster
          name: parsed.modelName,
          imageUrl: null,
          brandId: matchedCandidate.parentBrandId,
          brandName: parsed.brandName,
          categoryId: matchedCandidate.parentCategoryId,
          categoryName: matchedCandidate.parentCategoryName,
          categorySlug: matchedCandidate.parentCategorySlug,
        };
      }
    }

    if (!model) {
      res.status(404).json({ error: "Compatibility page not found" });
      return;
    }

    // 3. Query Direct and Reverse/Bidirectional Compatibilities
    const [directCompats, allPublishedCompats, technicalRecords, batteryRecords] = await Promise.all([
      // Direct entries where modelId = model.id
      model.id > 0
        ? db
            .select({
              id: compatibilitiesTable.id,
              name: compatibilitiesTable.name,
              partType: compatibilitiesTable.partType,
              comboType: compatibilitiesTable.comboType,
              qualityGrade: compatibilitiesTable.qualityGrade,
              notes: compatibilitiesTable.notes,
              imageUrl: compatibilitiesTable.imageUrl,
            })
            .from(compatibilitiesTable)
            .where(and(
              eq(compatibilitiesTable.modelId, model.id),
              eq(compatibilitiesTable.isPublished, true),
              sql`trim(${compatibilitiesTable.name}) <> ''`,
            ))
            .orderBy(compatibilitiesTable.partType, compatibilitiesTable.name)
        : Promise.resolve([]),

      // All published compatibilities with their parent model and brand (to compute bidirectional clusters)
      db
        .select({
          id: compatibilitiesTable.id,
          name: compatibilitiesTable.name,
          partType: compatibilitiesTable.partType,
          comboType: compatibilitiesTable.comboType,
          qualityGrade: compatibilitiesTable.qualityGrade,
          notes: compatibilitiesTable.notes,
          imageUrl: compatibilitiesTable.imageUrl,
          parentModelId: modelsTable.id,
          parentModelName: modelsTable.name,
          parentBrandName: brandsTable.name,
        })
        .from(compatibilitiesTable)
        .innerJoin(modelsTable, eq(modelsTable.id, compatibilitiesTable.modelId))
        .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
        .where(and(
          eq(compatibilitiesTable.isPublished, true),
          sql`trim(${compatibilitiesTable.name}) <> ''`,
        )),

      // Technical schematics (ISP Pinout & Test Point)
      db
        .select({
          id: schematicsTable.id,
          title: schematicsTable.title,
          slug: schematicsTable.slug,
          schematicType: schematicsTable.schematicType,
          fileUrl: schematicsTable.fileUrl,
          thumbnailUrl: schematicsTable.thumbnailUrl,
          testPointInfo: schematicsTable.testPointInfo,
          notes: schematicsTable.notes,
        })
        .from(schematicsTable)
        .where(and(
          eq(schematicsTable.isPublished, true),
          or(
            model.id > 0 ? eq(schematicsTable.modelId, model.id) : sql`false`,
            and(
              ilike(schematicsTable.deviceBrand, `%${model.brandName}%`),
              ilike(schematicsTable.deviceModel, `%${model.name}%`),
            ),
          ),
        ))
        .orderBy(schematicsTable.title),

      // Battery compatibility lookup for this phone model
      db
        .select({
          batteryModelId: batteryModelsTable.id,
          modelNumber: batteryModelsTable.modelNumber,
          capacity: batteryModelsTable.capacity,
          voltage: batteryModelsTable.voltage,
          notes: batteryModelsTable.notes,
          brandName: brandsTable.name,
          deviceName: batteryCompatibilityTable.deviceName,
        })
        .from(batteryCompatibilityTable)
        .innerJoin(batteryModelsTable, eq(batteryModelsTable.id, batteryCompatibilityTable.batteryModelId))
        .innerJoin(brandsTable, eq(brandsTable.id, batteryModelsTable.brandId))
        .where(
          or(
            ilike(batteryCompatibilityTable.deviceName, `%${model.name}%`),
            ilike(batteryCompatibilityTable.deviceName, `%${model.brandName} ${model.name}%`),
          ),
        ),
    ]);

    // 4. Merge direct items and reverse/cluster items so EVERY compatible model is connected bidirectionally!
    type CompatItem = {
      id: number;
      name: string;
      brandName: string;
      modelName: string;
      brandSlug: string;
      modelSlug: string;
      slugUrl: string;
      partType: string | null;
      comboType: string;
      qualityGrade: string | null;
      notes: string | null;
      imageUrl: string | null;
    };

    const compatMap = new Map<string, CompatItem>();
    const currentModelFull = `${model.brandName} ${model.name}`.toLowerCase();
    const currentModelClean = model.name.toLowerCase();

    // Add direct entries
    for (const item of directCompats) {
      const parsed = parseBrandAndModel(item.name, model.brandName);
      // Don't add current model as compatible with itself
      if (parsed.brandSlug === brandSlug && parsed.modelSlug === modelSlug) continue;

      compatMap.set(`${parsed.brandSlug}/${parsed.modelSlug}`, {
        id: item.id,
        name: item.name,
        brandName: parsed.brandName,
        modelName: parsed.modelName,
        brandSlug: parsed.brandSlug,
        modelSlug: parsed.modelSlug,
        slugUrl: parsed.slugUrl,
        partType: item.partType,
        comboType: item.comboType,
        qualityGrade: item.qualityGrade,
        notes: item.notes,
        imageUrl: item.imageUrl,
      });
    }

    // Add reverse / cluster entries (where this model was entered as compatible under another model)
    for (const item of allPublishedCompats) {
      const itemParsed = parseBrandAndModel(item.name, item.parentBrandName);
      const isTargetThisModel =
        (itemParsed.brandSlug === brandSlug && itemParsed.modelSlug === modelSlug) ||
        item.name.toLowerCase().includes(currentModelClean) ||
        currentModelFull.includes(item.name.toLowerCase());

      if (isTargetThisModel) {
        // The parent model is compatible with this model!
        const parentParsed = parseBrandAndModel(item.parentModelName, item.parentBrandName);
        if (parentParsed.brandSlug !== brandSlug || parentParsed.modelSlug !== modelSlug) {
          const key = `${parentParsed.brandSlug}/${parentParsed.modelSlug}`;
          if (!compatMap.has(key)) {
            compatMap.set(key, {
              id: item.id,
              name: `${item.parentBrandName} ${item.parentModelName}`,
              brandName: parentParsed.brandName,
              modelName: parentParsed.modelName,
              brandSlug: parentParsed.brandSlug,
              modelSlug: parentParsed.modelSlug,
              slugUrl: parentParsed.slugUrl,
              partType: item.partType || "Display Combo",
              comboType: item.comboType || "Compatible",
              qualityGrade: item.qualityGrade || null,
              notes: item.notes || null,
              imageUrl: item.imageUrl || null,
            });
          }
        }
      }
    }

    const finalCompatibilities = Array.from(compatMap.values());

    if (finalCompatibilities.length === 0 && technicalRecords.length === 0 && batteryRecords.length === 0) {
      res.status(404).json({ error: "This model has no published technical information" });
      return;
    }

    // Format Battery Details
    const batteryDetails = batteryRecords.map(b => ({
      batteryModelId: b.batteryModelId,
      modelNumber: b.modelNumber,
      brandName: b.brandName,
      capacity: b.capacity,
      voltage: b.voltage,
      notes: b.notes,
      slug: slugify(b.modelNumber),
      slugUrl: `/battery-compatibility/${slugify(b.modelNumber)}`,
    }));

    // Format Schematics with dedicated SEO URLs
    const formattedTechnicals = technicalRecords.map(r => ({
      ...r,
      slugUrl: r.slug ? (r.schematicType === "ISP Pinout" ? `/isp-pinout/${r.slug}` : `/test-point/${r.slug}`) : null,
    }));

    const canonicalPath = `/compatibility/${slugify(model.brandName)}/${slugify(model.name)}`;
    const canonicalUrl = `${canonicalOrigin(req)}${canonicalPath}`;

    const compatibleNames = finalCompatibilities.map(c => c.name);

    // Dynamic high-intent search tags (essential for ranking queries like "a12 lcd combo", "a12 display folder", etc.)
    const cleanName = model.name.replace(/^(Galaxy|Redmi|Mi|Poco|iPhone|Note|Oppo|Vivo|Realme)\s+/i, "").trim();
    const seoTags = Array.from(new Set([
      `${model.brandName} ${model.name} LCD Combo`,
      `${model.name} LCD Combo`,
      cleanName ? `${cleanName} LCD Combo` : "",
      `${model.name} Display Folder`,
      `${model.brandName} ${model.name} Screen Replacement`,
      `${model.name} Combo Compatibility`,
      `${model.name} Matching Models`,
      `${model.brandName} ${model.name} Touch Glass Digitizer`,
      `${model.name} Interchangeable Displays`,
      ...compatibleNames.slice(0, 8).map(n => `${n} Display Combo`),
    ].filter(Boolean)));

    // Structured Q&A for Google FAQPage Schema & user engagement
    const faqs = [
      {
        question: `Which mobile phone models share the same LCD combo as ${model.brandName} ${model.name}?`,
        answer: compatibleNames.length > 0
          ? `The ${model.brandName} ${model.name} display combo is verified compatible with ${compatibleNames.join(", ")}. These models share identical screen dimensions, flex cables, and digitizer connectors.`
          : `Currently, technical compatibility records for ${model.brandName} ${model.name} are being verified by technicians.`,
      },
      {
        question: `Can I replace the screen of ${model.brandName} ${model.name} with another phone display?`,
        answer: compatibleNames.length > 0
          ? `Yes, you can safely use display folders and screen replacements from ${compatibleNames.slice(0, 3).join(", ")} as they share identical panel geometry and touch controller specifications.`
          : `Screen replacements must match the original OEM flex connector and chassis dimensions.`,
      },
      {
        question: `What is the difference between OEM, Original, and High Quality display combos for ${model.name}?`,
        answer: `Original (OEM) displays use factory panels with accurate color fidelity and high refresh rates. Aftermarket and A+ grade combos offer a cost-effective alternative with good touch sensitivity and durability.`,
      },
      ...(batteryDetails.length > 0 ? [{
        question: `What battery model number is used in ${model.brandName} ${model.name}?`,
        answer: `${model.brandName} ${model.name} is powered by battery model ${batteryDetails.map(b => `${b.modelNumber} (${b.capacity || "Original Capacity"})`).join(", ")}.`,
      }] : []),
    ];

    const seoTitle = `${model.brandName} ${model.name} LCD Combo & Screen Compatibility List | PosCert`;
    const seoDescription = `Verified compatible models for ${model.brandName} ${model.name} LCD combo and display folder. Compatible with ${compatibleNames.slice(0, 4).join(", ")}${compatibleNames.length > 4 ? ` and ${compatibleNames.length - 4} more models` : ""}. Hardware replacement guide, battery specs & pinouts.`;

    res.json({
      model: {
        id: model.id,
        name: model.name,
        brandName: model.brandName,
        imageUrl: model.imageUrl,
        categoryName: model.categoryName,
        categorySlug: model.categorySlug,
      },
      compatibilities: finalCompatibilities,
      allCompatibleSlugs: finalCompatibilities.map(c => ({
        name: c.name,
        brandName: c.brandName,
        modelName: c.modelName,
        url: c.slugUrl,
      })),
      technicalRecords: formattedTechnicals,
      batteryRecords: batteryDetails,
      canonicalPath,
      canonicalUrl,
      seo: {
        title: seoTitle,
        description: seoDescription,
        keywords: seoTags.join(", "),
      },
      seoTags,
      faqs,
    });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to fetch model compatibility" });
  }
});

// Single-slug query resolution fallback for URLs like /compatibility/:query (e.g. /compatibility/a12, /compatibility/galaxy-a12)
router.get("/public/compatibility-by-query/:query", async (req, res): Promise<void> => {
  try {
    const rawQuery = String(req.params.query).trim().toLowerCase();
    const cleanQuery = rawQuery.replace(/-(lcd|combo|folder|display|screen|touch|digitizer)/g, "");

    const allModels = await db
      .select({
        id: modelsTable.id,
        name: modelsTable.name,
        brandName: brandsTable.name,
      })
      .from(modelsTable)
      .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId));

    const matched = allModels.find(m => {
      const bSlug = slugify(m.brandName);
      const mSlug = slugify(m.name);
      const fullSlug = `${bSlug}-${mSlug}`;
      const stripped = slugify(m.name.replace(/^(Galaxy|Redmi|Mi|Poco|iPhone|Note|Oppo|Vivo|Realme)\s+/i, ""));

      return mSlug === cleanQuery ||
        fullSlug === cleanQuery ||
        stripped === cleanQuery ||
        mSlug === rawQuery ||
        fullSlug === rawQuery;
    });

    if (matched) {
      res.json({
        found: true,
        brandSlug: slugify(matched.brandName),
        modelSlug: slugify(matched.name),
        redirectUrl: `/compatibility/${slugify(matched.brandName)}/${slugify(matched.name)}`,
      });
      return;
    }

    res.status(404).json({ error: "Model not found for query" });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to resolve query" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /public/battery-compatibility — Public Battery Search & Directory
// ─────────────────────────────────────────────────────────────────────────────
router.get("/public/battery-compatibility", async (req, res): Promise<void> => {
  try {
    const q = req.query.q ? String(req.query.q).trim().toLowerCase() : "";

    const rows = await db
      .select({
        id: batteryModelsTable.id,
        modelNumber: batteryModelsTable.modelNumber,
        capacity: batteryModelsTable.capacity,
        voltage: batteryModelsTable.voltage,
        notes: batteryModelsTable.notes,
        brandId: batteryModelsTable.brandId,
        brandName: brandsTable.name,
        deviceId: batteryCompatibilityTable.id,
        deviceName: batteryCompatibilityTable.deviceName,
        deviceNotes: batteryCompatibilityTable.notes,
      })
      .from(batteryModelsTable)
      .innerJoin(brandsTable, eq(brandsTable.id, batteryModelsTable.brandId))
      .leftJoin(batteryCompatibilityTable, eq(batteryCompatibilityTable.batteryModelId, batteryModelsTable.id))
      .orderBy(brandsTable.name, batteryModelsTable.modelNumber);

    // Group by battery model
    type BatteryGroup = {
      id: number;
      modelNumber: string;
      slug: string;
      slugUrl: string;
      capacity: string | null;
      voltage: string | null;
      notes: string | null;
      brandName: string;
      devices: Array<{ id: number; name: string; slug: string; slugUrl: string; notes: string | null }>;
    };

    const groupedMap = new Map<number, BatteryGroup>();

    for (const r of rows) {
      if (!groupedMap.has(r.id)) {
        const bSlug = slugify(r.modelNumber);
        groupedMap.set(r.id, {
          id: r.id,
          modelNumber: r.modelNumber,
          slug: bSlug,
          slugUrl: `/battery-compatibility/${bSlug}`,
          capacity: r.capacity,
          voltage: r.voltage,
          notes: r.notes,
          brandName: r.brandName,
          devices: [],
        });
      }

      if (r.deviceId && r.deviceName) {
        const devSlug = slugify(r.deviceName);
        groupedMap.get(r.id)!.devices.push({
          id: r.deviceId,
          name: r.deviceName,
          slug: devSlug,
          slugUrl: `/battery-compatibility/${devSlug}`,
          notes: r.deviceNotes,
        });
      }
    }

    let results = Array.from(groupedMap.values());

    // Filter by query if provided (matches battery model, brand, OR compatible device names!)
    if (q) {
      results = results.filter(b => {
        const matchesBattery = b.modelNumber.toLowerCase().includes(q) || b.brandName.toLowerCase().includes(q);
        const matchesDevice = b.devices.some(d => d.name.toLowerCase().includes(q));
        return matchesBattery || matchesDevice;
      });
    }

    res.json({
      batteries: results,
      totalCount: results.length,
      seo: {
        title: "Mobile Phone Battery Compatibility Directory | PosCert",
        description: "Search phone battery compatibility by Battery Model Number (e.g. BN59, EB-BA125ABY, BL-5C) or Mobile Device Name. Find exact capacity, voltage, and shared battery models.",
      },
    });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to fetch battery compatibility list" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /public/battery/:slug — Battery Model OR Phone Model Battery Details
// ─────────────────────────────────────────────────────────────────────────────
router.get(["/public/battery/:slug", "/public/battery-compatibility/:slug"], async (req, res): Promise<void> => {
  try {
    const slug = String(req.params.slug).toLowerCase().trim();

    // 1. First check if slug matches a Battery Model Number (e.g. bn59, eb-ba125aby)
    const allBatteries = await db
      .select({
        id: batteryModelsTable.id,
        modelNumber: batteryModelsTable.modelNumber,
        capacity: batteryModelsTable.capacity,
        voltage: batteryModelsTable.voltage,
        notes: batteryModelsTable.notes,
        brandId: batteryModelsTable.brandId,
        brandName: brandsTable.name,
      })
      .from(batteryModelsTable)
      .innerJoin(brandsTable, eq(brandsTable.id, batteryModelsTable.brandId));

    const matchedBattery = allBatteries.find(b => slugify(b.modelNumber) === slug);

    if (matchedBattery) {
      // Find all devices compatible with this battery
      const devices = await db
        .select()
        .from(batteryCompatibilityTable)
        .where(eq(batteryCompatibilityTable.batteryModelId, matchedBattery.id))
        .orderBy(batteryCompatibilityTable.deviceName);

      const formattedDevices = devices.map(d => {
        const devSlug = slugify(d.deviceName);
        const parsed = parseBrandAndModel(d.deviceName, matchedBattery.brandName);
        return {
          id: d.id,
          name: d.deviceName,
          slug: devSlug,
          notes: d.notes,
          batteryUrl: `/battery-compatibility/${devSlug}`,
          displayCompatibilityUrl: parsed.slugUrl,
        };
      });

      const canonicalPath = `/battery-compatibility/${slugify(matchedBattery.modelNumber)}`;
      const seoTitle = `${matchedBattery.brandName} ${matchedBattery.modelNumber} Battery Compatibility & Supported Phones | PosCert`;
      const seoDescription = `${matchedBattery.brandName} ${matchedBattery.modelNumber} (${matchedBattery.capacity ?? "Original"}, ${matchedBattery.voltage ?? "3.85V"}) battery compatibility list. Works with ${formattedDevices.map(d => d.name).slice(0, 6).join(", ")}.`;

      res.json({
        type: "battery",
        battery: {
          ...matchedBattery,
          slug: slugify(matchedBattery.modelNumber),
        },
        devices: formattedDevices,
        canonicalPath,
        canonicalUrl: `${canonicalOrigin(req)}${canonicalPath}`,
        seo: { title: seoTitle, description: seoDescription },
      });
      return;
    }

    // 2. If not matched by battery model, check if slug matches a Phone Device Name!
    // e.g. "redmi-note-10" or "samsung-galaxy-a12"
    const allDeviceRows = await db
      .select({
        deviceId: batteryCompatibilityTable.id,
        deviceName: batteryCompatibilityTable.deviceName,
        deviceNotes: batteryCompatibilityTable.notes,
        batteryModelId: batteryModelsTable.id,
        modelNumber: batteryModelsTable.modelNumber,
        capacity: batteryModelsTable.capacity,
        voltage: batteryModelsTable.voltage,
        batteryNotes: batteryModelsTable.notes,
        brandName: brandsTable.name,
      })
      .from(batteryCompatibilityTable)
      .innerJoin(batteryModelsTable, eq(batteryModelsTable.id, batteryCompatibilityTable.batteryModelId))
      .innerJoin(brandsTable, eq(brandsTable.id, batteryModelsTable.brandId));

    const matchedDeviceRow = allDeviceRows.find(d => slugify(d.deviceName) === slug);

    if (matchedDeviceRow) {
      // Find all OTHER devices that use this same battery model
      const siblingDevices = allDeviceRows
        .filter(d => d.batteryModelId === matchedDeviceRow.batteryModelId)
        .map(d => ({
          id: d.deviceId,
          name: d.deviceName,
          slug: slugify(d.deviceName),
          isCurrent: slugify(d.deviceName) === slug,
          batteryUrl: `/battery-compatibility/${slugify(d.deviceName)}`,
          displayCompatibilityUrl: parseBrandAndModel(d.deviceName, d.brandName).slugUrl,
        }));

      const canonicalPath = `/battery-compatibility/${slug}`;
      const seoTitle = `${matchedDeviceRow.deviceName} Battery Model & Compatibility (${matchedDeviceRow.modelNumber}) | PosCert`;
      const seoDescription = `What battery does ${matchedDeviceRow.deviceName} use? Uses ${matchedDeviceRow.brandName} ${matchedDeviceRow.modelNumber} (${matchedDeviceRow.capacity ?? ""}). Shared battery compatibility with ${siblingDevices.filter(s => !s.isCurrent).map(s => s.name).slice(0, 5).join(", ")}.`;

      res.json({
        type: "device",
        device: {
          name: matchedDeviceRow.deviceName,
          slug,
        },
        battery: {
          id: matchedDeviceRow.batteryModelId,
          modelNumber: matchedDeviceRow.modelNumber,
          capacity: matchedDeviceRow.capacity,
          voltage: matchedDeviceRow.voltage,
          notes: matchedDeviceRow.batteryNotes,
          brandName: matchedDeviceRow.brandName,
          slug: slugify(matchedDeviceRow.modelNumber),
          slugUrl: `/battery-compatibility/${slugify(matchedDeviceRow.modelNumber)}`,
        },
        compatibleDevices: siblingDevices,
        canonicalPath,
        canonicalUrl: `${canonicalOrigin(req)}${canonicalPath}`,
        seo: { title: seoTitle, description: seoDescription },
      });
      return;
    }

    res.status(404).json({ error: "Battery or device compatibility record not found" });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to fetch battery record" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET /public/schematics — Public Directory for ISP Pinout & Test Points
// ─────────────────────────────────────────────────────────────────────────────
router.get("/public/schematics", async (req, res): Promise<void> => {
  try {
    const typeFilter = req.query.type ? String(req.query.type).trim() : "";
    const brandFilter = req.query.brand ? String(req.query.brand).trim() : "";
    const q = req.query.q ? String(req.query.q).trim().toLowerCase() : "";

    let rows = await db
      .select({
        id: schematicsTable.id,
        title: schematicsTable.title,
        slug: schematicsTable.slug,
        deviceBrand: schematicsTable.deviceBrand,
        deviceModel: schematicsTable.deviceModel,
        schematicType: schematicsTable.schematicType,
        fileUrl: schematicsTable.fileUrl,
        thumbnailUrl: schematicsTable.thumbnailUrl,
        tags: schematicsTable.tags,
        notes: schematicsTable.notes,
        createdAt: schematicsTable.createdAt,
      })
      .from(schematicsTable)
      .where(and(eq(schematicsTable.isPublished, true), isNotNull(schematicsTable.slug)))
      .orderBy(schematicsTable.deviceBrand, schematicsTable.deviceModel, schematicsTable.title);

    if (typeFilter) {
      rows = rows.filter(r => (r.schematicType ?? "").toLowerCase() === typeFilter.toLowerCase());
    }
    if (brandFilter) {
      rows = rows.filter(r => (r.deviceBrand ?? "").toLowerCase() === brandFilter.toLowerCase());
    }
    if (q) {
      rows = rows.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.deviceBrand ?? "").toLowerCase().includes(q) ||
        (r.deviceModel ?? "").toLowerCase().includes(q) ||
        (r.tags ?? "").toLowerCase().includes(q)
      );
    }

    const formatted = rows.map(r => {
      const publicPath = r.schematicType === "ISP Pinout" ? `/isp-pinout/${r.slug}` : `/test-point/${r.slug}`;
      const compatPath = r.deviceBrand && r.deviceModel
        ? `/compatibility/${slugify(r.deviceBrand)}/${slugify(r.deviceModel)}`
        : null;
      return {
        ...r,
        slugUrl: publicPath,
        compatibilityUrl: compatPath,
      };
    });

    res.json({
      schematics: formatted,
      totalCount: formatted.length,
    });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to fetch schematics directory" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. GET /public/isp/:slug & /public/isp-pinout/:slug — ISP Pinout Details
// ─────────────────────────────────────────────────────────────────────────────
router.get(["/public/isp/:slug", "/public/isp-pinout/:slug"], async (req, res): Promise<void> => {
  try {
    const slug = String(req.params.slug).trim();
    const [record] = await db
      .select()
      .from(schematicsTable)
      .where(and(
        eq(schematicsTable.slug, slug),
        eq(schematicsTable.isPublished, true),
      ))
      .limit(1);

    if (!record) {
      res.status(404).json({ error: "Published ISP pinout record not found" });
      return;
    }

    const canonicalPath = `/isp-pinout/${slug}`;
    const compatUrl = record.deviceBrand && record.deviceModel
      ? `/compatibility/${slugify(record.deviceBrand)}/${slugify(record.deviceModel)}`
      : null;

    res.json({
      record,
      canonicalPath,
      canonicalUrl: `${canonicalOrigin(req)}${canonicalPath}`,
      compatibilityUrl: compatUrl,
      seo: {
        title: `${record.title} eMMC/UFS ISP Pinout | PosCert`,
        description: `High-resolution ISP pinout diagram, CLK, CMD, DAT0, VCC, VCCQ pin connection points for ${record.deviceBrand ?? ""} ${record.deviceModel ?? ""}. Flashing, FRP, and dead boot repair.`,
      },
    });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to fetch ISP pinout record" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET /public/test-point/:slug & /public/pinout/:slug — Test Point Details
// ─────────────────────────────────────────────────────────────────────────────
router.get(["/public/test-point/:slug", "/public/pinout/:slug"], async (req, res): Promise<void> => {
  try {
    const slug = String(req.params.slug).trim();
    const [record] = await db
      .select()
      .from(schematicsTable)
      .where(and(
        eq(schematicsTable.slug, slug),
        eq(schematicsTable.isPublished, true),
      ))
      .limit(1);

    if (!record) {
      res.status(404).json({ error: "Published test point record not found" });
      return;
    }

    const canonicalPath = `/test-point/${slug}`;
    const compatUrl = record.deviceBrand && record.deviceModel
      ? `/compatibility/${slugify(record.deviceBrand)}/${slugify(record.deviceModel)}`
      : null;

    res.json({
      record,
      canonicalPath,
      canonicalUrl: `${canonicalOrigin(req)}${canonicalPath}`,
      compatibilityUrl: compatUrl,
      seo: {
        title: `${record.title} EDL / BROM Test Point | PosCert`,
        description: `Emergency Download (EDL 9008) and BROM mode hardware test point connection image for ${record.deviceBrand ?? ""} ${record.deviceModel ?? ""}. Unbrick, flash, and remove FRP.`,
      },
    });
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to fetch test point record" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. GET /public/sitemap.xml — Dynamic Sitemap for Google Search Console
// ─────────────────────────────────────────────────────────────────────────────
router.get("/public/sitemap.xml", async (req, res): Promise<void> => {
  try {
    const origin = canonicalOrigin(req);

    const [modelRows, compatRows, technicalRows, batteryModelRows, batteryDeviceRows] = await Promise.all([
      // Primary models with published compatibilities
      db
        .select({
          brandName: brandsTable.name,
          modelName: modelsTable.name,
          updatedAt: compatibilitiesTable.createdAt,
        })
        .from(compatibilitiesTable)
        .innerJoin(modelsTable, eq(modelsTable.id, compatibilitiesTable.modelId))
        .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
        .where(and(
          eq(compatibilitiesTable.isPublished, true),
          sql`trim(${compatibilitiesTable.name}) <> ''`,
        ))
        .groupBy(brandsTable.id, modelsTable.id, compatibilitiesTable.createdAt),

      // Compatible model entries (so all 10 models get indexed even if only listed as names!)
      db
        .select({
          name: compatibilitiesTable.name,
          parentBrandName: brandsTable.name,
          updatedAt: compatibilitiesTable.createdAt,
        })
        .from(compatibilitiesTable)
        .innerJoin(modelsTable, eq(modelsTable.id, compatibilitiesTable.modelId))
        .innerJoin(brandsTable, eq(brandsTable.id, modelsTable.brandId))
        .where(and(
          eq(compatibilitiesTable.isPublished, true),
          sql`trim(${compatibilitiesTable.name}) <> ''`,
        )),

      // Schematics (ISP Pinout & Test Point)
      db
        .select({
          slug: schematicsTable.slug,
          schematicType: schematicsTable.schematicType,
          updatedAt: schematicsTable.createdAt,
        })
        .from(schematicsTable)
        .where(and(eq(schematicsTable.isPublished, true), isNotNull(schematicsTable.slug))),

      // Battery Models
      db
        .select({
          modelNumber: batteryModelsTable.modelNumber,
          updatedAt: batteryModelsTable.createdAt,
        })
        .from(batteryModelsTable),

      // Battery Compatible Devices
      db
        .select({
          deviceName: batteryCompatibilityTable.deviceName,
          updatedAt: batteryCompatibilityTable.createdAt,
        })
        .from(batteryCompatibilityTable),
    ]);

    const urls = new Map<string, string | null>();

    // Static landing pages
    urls.set("/compatibility", new Date().toISOString());
    urls.set("/battery-compatibility", new Date().toISOString());
    urls.set("/isp-pinout", new Date().toISOString());
    urls.set("/test-point", new Date().toISOString());

    // Primary model pages
    for (const row of modelRows) {
      urls.set(`/compatibility/${slugify(row.brandName)}/${slugify(row.modelName)}`, row.updatedAt?.toISOString() ?? null);
    }

    // Compatible connected model pages (ensuring all 10 models rank!)
    for (const row of compatRows) {
      const parsed = parseBrandAndModel(row.name, row.parentBrandName);
      if (parsed.brandSlug && parsed.modelSlug) {
        urls.set(parsed.slugUrl, row.updatedAt?.toISOString() ?? null);
      }
    }

    // Schematics
    for (const row of technicalRows) {
      if (!row.slug) continue;
      const path = row.schematicType === "ISP Pinout" ? `/isp-pinout/${row.slug}` : `/test-point/${row.slug}`;
      urls.set(path, row.updatedAt?.toISOString() ?? null);
    }

    // Battery Models
    for (const row of batteryModelRows) {
      if (!row.modelNumber) continue;
      urls.set(`/battery-compatibility/${slugify(row.modelNumber)}`, row.updatedAt?.toISOString() ?? null);
    }

    // Battery Devices
    for (const row of batteryDeviceRows) {
      if (!row.deviceName) continue;
      urls.set(`/battery-compatibility/${slugify(row.deviceName)}`, row.updatedAt?.toISOString() ?? null);
    }

    const body = Array.from(urls.entries())
      .map(([path, lastmod]) => [
        "  <url>",
        `    <loc>${escapeXml(`${origin}${path}`)}</loc>`,
        lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : "",
        "    <changefreq>weekly</changefreq>",
        "  </url>",
      ].filter(Boolean).join("\n"))
      .join("\n");

    res.type("application/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`,
    );
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).type("text/plain").send("Error generating sitemap");
  }
});

export default router;
