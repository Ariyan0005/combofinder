// Registry of "part type" compatibility modules that live alongside the
// original Display Compatibility module. Each one is a distinct product
// category (categoriesTable row, matched by slug) whose brands/models are
// managed on its own dedicated admin page instead of the generic
// "/brands" (Display) list.
//
// To add a new module: create the category row in the DB, add an entry
// here, add its page + route + sidebar nav item. brands.tsx and
// brand-models.tsx read this registry so they stay correct automatically.
export interface CategoryModule {
  slug: string;
  label: string; // e.g. "Battery Compatibility" (page title / nav label)
  brandsLabel: string; // e.g. "Battery Brands" (breadcrumb label)
  href: string; // e.g. "/battery-brands"
}

export const CATEGORY_MODULES: CategoryModule[] = [
  { slug: "battery", label: "Battery Compatibility", brandsLabel: "Battery Brands", href: "/battery-brands" },
  { slug: "ic", label: "IC Compatibility", brandsLabel: "IC Brands", href: "/ic-brands" },
];
