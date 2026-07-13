import { useParams, useLocation } from "wouter";
import { useGetBrand, useGetBrandModels } from "@workspace/api-client-react";
import { ArrowLeft, Smartphone, ChevronRight } from "lucide-react";

export default function BrandDetail() {
  const { id } = useParams<{ id: string }>();
  const brandId = Number(id);
  const [, navigate] = useLocation();

  const { data: brand, isLoading: brandLoading } = useGetBrand(brandId);
  const { data: models, isLoading: modelsLoading } = useGetBrandModels(brandId);

  const isLoading = brandLoading || modelsLoading;

  return (
    <div className="space-y-4">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Brands
      </button>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-border p-4">
            <h1 className="text-2xl font-bold">{brand?.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">{models?.length ?? 0} models available</p>
          </div>

          <div className="space-y-2">
            {models?.map((model) => (
              <button
                key={model.id}
                onClick={() => navigate(`/models/${model.id}`)}
                className="w-full bg-white rounded-xl border border-border p-3 flex items-center justify-between hover:border-primary/40 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{model.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {model.releaseYear ? `${model.releaseYear} · ` : ""}{model.comboCount} entries
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
            {models?.length === 0 && (
              <p className="text-center py-8 text-sm text-muted-foreground">No models found for this brand</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
