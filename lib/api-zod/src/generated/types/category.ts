export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  sortOrder: number;
  brandCount: number;
  createdAt: Date;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  icon?: string | null;
  sortOrder?: number;
}
