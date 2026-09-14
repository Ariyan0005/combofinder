import { Router } from "express";
import { and, eq, isNull, isNotNull, or, sql } from "drizzle-orm";
import {
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
  return row.schematicType === "ISP Pinout" ? `/isp/${row.slug}` : `/pinout/${row.slug}`;
}

router.get("/public/compatibility/:brandSlug/:modelSlug", async (req, res): Promise<void> => {
  const brandSlug = String(req.params.brandSlug);
  const modelSlug = String(req.params.modelSlug);

  const [model] = await db
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

  if (!model) {
    res.status(404).json({ error: "Compatibility page not found" });
    return;
  }

  const [compatibilities, technicalRecords] = await Promise.all([
    db
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
      .orderBy(compatibilitiesTable.partType, compatibilitiesTable.name),
    db
      .select({
        id: schematicsTable.id,
        title: schematicsTable.title,
        slug: schematicsTable.slug,
        schematicType: schematicsTable.schematicType,
        fileUrl: schematicsTable.fileUrl,
        thumbnailUrl: schematicsTable.thumbnailUrl,
      })
      .from(schematicsTable)
      .where(and(
        eq(schematicsTable.isPublished, true),
        or(
          eq(schematicsTable.modelId, model.id),
          and(
            isNull(schematicsTable.modelId),
            eq(schematicsTable.deviceBrand, model.brandName),
            eq(schematicsTable.deviceModel, model.name),
          ),
        ),
      ))
      .orderBy(schematicsTable.title),
  ]);

  if (compatibilities.length === 0 && technicalRecords.length === 0) {
    res.status(404).json({ error: "This model has no published technical information" });
    return;
  }

  const canonicalPath = `/compatibility/${slugify(model.brandName)}/${slugify(model.name)}`;
  const canonicalUrl = `${canonicalOrigin(req)}${canonicalPath}`;
  res.json({
    model,
    compatibilities,
    technicalRecords,
    canonicalPath,
    canonicalUrl,
    seo: {
      title: `${model.brandName} ${model.name} Compatibility`,
      description: `Compatibility and technical information for ${model.brandName} ${model.name}.`,
    },
  });
});

router.get("/public/isp/:slug", async (req, res): Promise<void> => {
  const slug = String(req.params.slug);
  const [record] = await db
    .select()
    .from(schematicsTable)
    .where(and(
      eq(schematicsTable.slug, slug),
      eq(schematicsTable.isPublished, true),
      eq(schematicsTable.schematicType, "ISP Pinout"),
    ))
    .limit(1);

  if (!record) {
    res.status(404).json({ error: "Published ISP record not found" });
    return;
  }

  res.json({
    record,
    canonicalPath: `/isp/${slug}`,
    canonicalUrl: `${canonicalOrigin(req)}/isp/${slug}`,
    seo: {
      title: `${record.title} | PosCert`,
      description: `ISP and test point information for ${record.deviceBrand ?? ""} ${record.deviceModel ?? ""}.`,
    },
  });
});

router.get("/public/pinout/:slug", async (req, res): Promise<void> => {
  const slug = String(req.params.slug);
  const [record] = await db
    .select()
    .from(schematicsTable)
    .where(and(eq(schematicsTable.slug, slug), eq(schematicsTable.isPublished, true)))
    .limit(1);

  if (!record) {
    res.status(404).json({ error: "Published pinout record not found" });
    return;
  }

  res.json({
    record,
    canonicalPath: `/pinout/${slug}`,
    canonicalUrl: `${canonicalOrigin(req)}/pinout/${slug}`,
    seo: {
      title: `${record.title} | PosCert`,
      description: `Pinout and technical information for ${record.deviceBrand ?? ""} ${record.deviceModel ?? ""}.`,
    },
  });
});

router.get("/public/sitemap.xml", async (req, res): Promise<void> => {
  const origin = canonicalOrigin(req);
  const [modelRows, technicalRows] = await Promise.all([
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
    db
      .select({
        id: schematicsTable.id,
        slug: schematicsTable.slug,
        schematicType: schematicsTable.schematicType,
        updatedAt: schematicsTable.createdAt,
      })
      .from(schematicsTable)
      .where(and(eq(schematicsTable.isPublished, true), isNotNull(schematicsTable.slug))),
  ]);

  const urls = new Map<string, string | null>();
  for (const row of modelRows) {
    urls.set(`/compatibility/${slugify(row.brandName)}/${slugify(row.modelName)}`, row.updatedAt?.toISOString() ?? null);
  }
  for (const row of technicalRows) {
    const path = publicTechnicalPath(row);
    if (path) urls.set(path, row.updatedAt?.toISOString() ?? null);
  }

  const body = Array.from(urls.entries())
    .map(([path, lastmod]) => [
      "  <url>",
      `    <loc>${escapeXml(`${origin}${path}`)}</loc>`,
      lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : "",
      "  </url>",
    ].filter(Boolean).join("\n"))
    .join("\n");

  res.type("application/xml").send(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`,
  );
});

export default router;