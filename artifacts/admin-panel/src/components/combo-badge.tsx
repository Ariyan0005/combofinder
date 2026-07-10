import { Badge } from "@/components/ui/badge";

type ComboType = "OEM" | "Compatible" | "Refurbished";

export function ComboBadge({ type }: { type: ComboType | string }) {
  if (type === "OEM") {
    return <Badge className="bg-primary text-primary-foreground hover:bg-primary">OEM</Badge>;
  }
  if (type === "Compatible") {
    return <Badge variant="secondary" className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">Compatible</Badge>;
  }
  if (type === "Refurbished") {
    return <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">Refurbished</Badge>;
  }
  return <Badge variant="outline">{type}</Badge>;
}
