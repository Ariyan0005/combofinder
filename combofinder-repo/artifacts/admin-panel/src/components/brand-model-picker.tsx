import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface BrandRow {
  id: number;
  name: string;
}
export interface ModelRow {
  id: number;
  brandId: number;
  name: string;
}

export function useBrands() {
  return useQuery<BrandRow[]>({
    queryKey: ["picker-brands"],
    queryFn: async () => {
      const r = await fetch("/api/brands", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load brands");
      return r.json();
    },
    staleTime: 60_000,
  });
}

export function useModelsForBrand(brandId: number | null) {
  return useQuery<ModelRow[]>({
    queryKey: ["picker-models", brandId],
    queryFn: async () => {
      const r = await fetch(`/api/brands/${brandId}/models`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load models");
      return r.json();
    },
    enabled: !!brandId,
    staleTime: 30_000,
  });
}

/**
 * Single Brand -> Model select pair. Reports the chosen brand/model *names*
 * (not ids) since consuming pages store plain display text, not foreign keys.
 * This guarantees the value always matches a real brand/model in the database
 * -- no more free-typed, misspelled brand/model names.
 */
export function SingleModelPicker({
  brandName,
  modelName,
  onChange,
}: {
  brandName: string;
  modelName: string;
  onChange: (brand: string, model: string) => void;
}) {
  const { data: brands = [], isLoading: brandsLoading } = useBrands();
  const selectedBrand = brands.find(b => b.name === brandName) ?? null;
  const { data: models = [], isLoading: modelsLoading } = useModelsForBrand(selectedBrand?.id ?? null);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Brand *</Label>
        <Select
          value={brandName || undefined}
          onValueChange={(v) => onChange(v, "")}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder={brandsLoading ? "Loading…" : "Select brand"} />
          </SelectTrigger>
          <SelectContent>
            {brands.map(b => (
              <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
            ))}
            {brands.length === 0 && !brandsLoading && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No brands yet — add one under Brands first</div>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Model *</Label>
        <Select
          value={modelName || undefined}
          onValueChange={(v) => onChange(brandName, v)}
          disabled={!selectedBrand}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder={!selectedBrand ? "Pick brand first" : modelsLoading ? "Loading…" : "Select model"} />
          </SelectTrigger>
          <SelectContent>
            {models.map(m => (
              <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
            ))}
            {selectedBrand && models.length === 0 && !modelsLoading && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No models yet under this brand</div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/**
 * Multi-model picker: pick a brand, then check any number of its models to
 * add them as chips. Supports picking models across multiple brands.
 * Reports the full list of selected model names (deduped, in the same
 * "comma separated model name" shape the parts table already stores).
 */
export function MultiModelPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (models: string[]) => void;
}) {
  const { data: brands = [], isLoading: brandsLoading } = useBrands();
  const [brandId, setBrandId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const { data: models = [], isLoading: modelsLoading } = useModelsForBrand(brandId);

  function toggle(name: string) {
    if (selected.includes(name)) onChange(selected.filter(n => n !== name));
    else onChange([...selected, name]);
  }
  function remove(name: string) {
    onChange(selected.filter(n => n !== name));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
        {selected.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1.5">No models selected yet.</p>
        ) : (
          selected.map(name => (
            <span key={name} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
              {name}
              <button type="button" onClick={() => remove(name)} className="hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between h-9 px-3 rounded-md border border-input bg-card text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          + Add compatible model
          <ChevronDown className="h-4 w-4" />
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full bg-popover border border-border rounded-md shadow-lg p-3 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Brand</Label>
              <Select value={brandId ? String(brandId) : undefined} onValueChange={(v) => setBrandId(Number(v))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={brandsLoading ? "Loading…" : "Select brand"} />
                </SelectTrigger>
                <SelectContent>
                  {brands.map(b => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {brandId && (
              <div className="max-h-48 overflow-y-auto space-y-0.5 border-t border-border pt-2">
                {modelsLoading ? (
                  <p className="text-xs text-muted-foreground px-1 py-1">Loading models…</p>
                ) : models.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-1 py-1">No models under this brand yet.</p>
                ) : (
                  models.map(m => {
                    const checked = selected.includes(m.name);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => toggle(m.name)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs hover:bg-muted text-left"
                      >
                        {m.name}
                        {checked && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button type="button" onClick={() => setOpen(false)} className="text-xs font-medium text-primary hover:underline">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
