import { useParams, useLocation } from "wouter";
import { useGetModel } from "@workspace/api-client-react";
import { ArrowLeft, CheckCircle, XCircle, Star, BadgeCheck, Repeat2 } from "lucide-react";

type ComboType = "OEM" | "Compatible" | "Refurbished";

const comboTypeConfig: Record<ComboType, { label: string; color: string; icon: React.ElementType }> = {
  OEM: { label: "OEM", color: "bg-blue-100 text-blue-700", icon: BadgeCheck },
  Compatible: { label: "Compatible", color: "bg-green-100 text-green-700", icon: CheckCircle },
  Refurbished: { label: "Refurbished", color: "bg-amber-100 text-amber-700", icon: Repeat2 },
};

export default function ModelDetail() {
  const { id } = useParams<{ id: string }>();
  const modelId = Number(id);
  const [, navigate] = useLocation();

  const { data: model, isLoading } = useGetModel(modelId);

  const oemCount = model?.combos.filter((c) => c.comboType === "OEM").length ?? 0;
  const compatibleCount = model?.combos.filter((c) => c.comboType === "Compatible").length ?? 0;
  const refurbishedCount = model?.combos.filter((c) => c.comboType === "Refurbished").length ?? 0;
  const inStockCount = model?.combos.filter((c) => c.inStock).length ?? 0;

  return (
    <div className="space-y-4">
      <button
        onClick={() => history.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : model ? (
        <>
          <div className="bg-white rounded-xl border border-border p-4">
            <button
              onClick={() => navigate(`/brands/${model.brandId}`)}
              className="text-xs text-primary font-medium hover:underline"
            >
              {model.brandName}
            </button>
            <h1 className="text-2xl font-bold mt-0.5">{model.name}</h1>
            {model.releaseYear && (
              <p className="text-sm text-muted-foreground mt-1">Released {model.releaseYear}</p>
            )}
          </div>

          {model.combos.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "OEM", count: oemCount, color: "text-blue-600" },
                { label: "Compatible", count: compatibleCount, color: "text-green-600" },
                { label: "Refurbished", count: refurbishedCount, color: "text-amber-600" },
                { label: "In Stock", count: inStockCount, color: "text-primary" },
              ].map(({ label, count, color }) => (
                <div key={label} className="bg-white rounded-xl border border-border p-3 text-center">
                  <p className={`text-xl font-bold ${color}`}>{count}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Display Combos ({model.combos.length})
            </h2>
            {model.combos.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
                No combos available for this model yet
              </div>
            ) : (
              model.combos.map((combo) => {
                const config = comboTypeConfig[combo.comboType as ComboType];
                const Icon = config?.icon ?? Star;
                return (
                  <div key={combo.id} className="bg-white rounded-xl border border-border p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm">{combo.name}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${config?.color ?? "bg-gray-100 text-gray-600"}`}>
                        <Icon className="w-3 h-3" />
                        {combo.comboType}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {combo.qualityGrade && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" /> Grade: {combo.qualityGrade}
                        </span>
                      )}
                      {combo.priceRange && (
                        <span className="font-medium text-foreground">{combo.priceRange}</span>
                      )}
                      <span className={`flex items-center gap-1 font-medium ${combo.inStock ? "text-green-600" : "text-red-500"}`}>
                        {combo.inStock ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {combo.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>

                    {combo.notes && (
                      <p className="text-xs text-muted-foreground border-t border-border pt-2">{combo.notes}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-10 text-muted-foreground">Model not found</div>
      )}
    </div>
  );
}
