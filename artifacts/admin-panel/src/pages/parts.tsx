import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Search, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PART_TYPES = ["LCD / Display","Battery","FPC Connector","Charging Sub Board","Power/Volume Flex","Back Cover","Frame / Middle Frame","Touch / OCA Glass","Tempered Glass","Other"];

interface Part { id: number; partName: string; partType: string; compatibleModels: string; description: string | null; createdAt: string; }
const API_BASE = "/api";
async function fetchParts(): Promise<Part[]> { const r = await fetch(`${API_BASE}/parts`); if(!r.ok) throw new Error("x"); return r.json(); }
async function createPart(d: Omit<Part,"id"|"createdAt">): Promise<Part> { const r = await fetch(`${API_BASE}/parts`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}); if(!r.ok) throw new Error("x"); return r.json(); }
async function updatePart(id: number, d: Partial<Omit<Part,"id"|"createdAt">>): Promise<Part> { const r = await fetch(`${API_BASE}/parts/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}); if(!r.ok) throw new Error("x"); return r.json(); }
async function deletePart(id: number): Promise<void> { const r = await fetch(`${API_BASE}/parts/${id}`,{method:"DELETE"}); if(!r.ok) throw new Error("x"); }

interface PFP { def?: Part; pt: string; onPt: (v:string)=>void; }
function PartForm({ def, pt, onPt }: PFP) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2"><Label>Part Type *</Label><Select value={pt} onValueChange={onPt}><SelectTrigger><SelectValue placeholder="Select type"/></SelectTrigger><SelectContent>{PART_TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Part Name *</Label><Input name="partName" required defaultValue={def?.partName} placeholder="e.g. Samsung Galaxy S21 LCD" autoFocus/></div>
      <div className="space-y-2"><Label>Compatible Models *</Label><Input name="compatibleModels" required defaultValue={def?.compatibleModels} placeholder="Samsung S21, Samsung S21+"/><p className="text-xs text-muted-foreground">Comma separated</p></div>
      <div className="space-y-2"><Label>Description</Label><Textarea name="description" defaultValue={def?.description||""} placeholder="Optional notes..." rows={3}/></div>
    </div>
  );
}

export default function Parts() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part|null>(null);
  const [cpt, setCpt] = useState("");
  const [ept, setEpt] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: parts=[], isLoading } = useQuery({ queryKey:["parts"], queryFn:fetchParts });
  const filtered = parts.filter(p => (!search||p.partName.toLowerCase().includes(search.toLowerCase())||p.compatibleModels.toLowerCase().includes(search.toLowerCase())) && (typeFilter==="all"||p.partType===typeFilter));
  const cm = useMutation({ mutationFn:createPart, onSuccess:()=>{ qc.invalidateQueries({queryKey:["parts"]}); setIsCreateOpen(false); setCpt(""); toast({title:"Part created"}); }, onError:()=>toast({title:"Failed",variant:"destructive"}) });
  const um = useMutation({ mutationFn:({id,data}:{id:number;data:Parameters<typeof updatePart>[1]})=>updatePart(id,data), onSuccess:()=>{ qc.invalidateQueries({queryKey:["parts"]}); setEditingPart(null); toast({title:"Part updated"}); }, onError:()=>toast({title:"Failed",variant:"destructive"}) });
  const dm = useMutation({ mutationFn:deletePart, onSuccess:()=>{ qc.invalidateQueries({queryKey:["parts"]}); toast({title:"Part deleted"}); }, onError:()=>toast({title:"Failed",variant:"destructive"}) });
  const hc = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const fd=new FormData(e.currentTarget); cm.mutate({ partName:(fd.get("partName") as string).trim(), partType:cpt, compatibleModels:(fd.get("compatibleModels") as string).trim(), description:(fd.get("description") as string).trim()||null }); };
  const hu = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); if(!editingPart) return; const fd=new FormData(e.currentTarget); um.mutate({ id:editingPart.id, data:{ partName:(fd.get("partName") as string).trim(), partType:ept, compatibleModels:(fd.get("compatibleModels") as string).trim(), description:(fd.get("description") as string).trim()||null } }); };
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">Parts</h1><p className="text-muted-foreground mt-1">Manage LCD, Battery, FPC Connector, Sub Board & more.</p></div>
        <Button onClick={()=>{ setCpt(""); setIsCreateOpen(true); }} className="gap-2"><Plus className="h-4 w-4"/> Add Part</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center flex-1 space-x-2 bg-card p-2 rounded-lg border border-border"><Search className="h-5 w-5 text-muted-foreground ml-2"/><Input placeholder="Search by part name or phone model..." value={search} onChange={e=>setSearch(e.target.value)} className="border-0 shadow-none focus-visible:ring-0"/></div>
        <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Types"/></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{PART_TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Part Name</TableHead><TableHead>Type</TableHead><TableHead>Compatible Models</TableHead><TableHead>Added</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading?<TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
            :filtered.length===0?<TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground"><div className="flex flex-col items-center gap-2"><Wrench className="h-8 w-8 opacity-30"/><span>No parts found.</span></div></TableCell></TableRow>
            :filtered.map(p=>(
              <TableRow key={p.id} className="group">
                <TableCell className="font-medium">{p.partName}</TableCell>
                <TableCell><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{p.partType}</span></TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[220px] truncate" title={p.compatibleModels}>{p.compatibleModels}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={()=>{ setEpt(p.partType); setEditingPart(p); }}><Edit2 className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={()=>{ if(confirm("Delete?")) dm.mutate(p.id); }}><Trash2 className="h-4 w-4"/></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}><DialogContent className="max-w-lg"><form onSubmit={hc}><DialogHeader><DialogTitle>Add New Part</DialogTitle></DialogHeader><PartForm pt={cpt} onPt={setCpt}/><DialogFooter><Button type="button" variant="outline" onClick={()=>setIsCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={!cpt||cm.isPending}>Save</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={!!editingPart} onOpenChange={o=>!o&&setEditingPart(null)}><DialogContent className="max-w-lg"><form onSubmit={hu}><DialogHeader><DialogTitle>Edit Part</DialogTitle></DialogHeader><PartForm def={editingPart??undefined} pt={ept} onPt={setEpt}/><DialogFooter><Button type="button" variant="outline" onClick={()=>setEditingPart(null)}>Cancel</Button><Button type="submit" disabled={!ept||um.isPending}>Save</Button></DialogFooter></form></DialogContent></Dialog>
    </div>
  );
}
