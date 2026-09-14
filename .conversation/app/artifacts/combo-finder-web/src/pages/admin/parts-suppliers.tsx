import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Phone,
  Globe,
  Star,
  Edit3,
  Trash2,
  X,
  Check,
  ExternalLink,
  RefreshCw,
  Shield,
  MessageCircle
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  phone?: string[] | string;
  whatsapp?: string[] | string;
  location?: string;
  website?: string;
  partTypes?: string[] | string;
  rating?: number;
  reviewsCount?: number;
}

const DEFAULT_PART_TYPES = ["LCD", "Battery", "Touch", "Glass", "Charging Port", "Flex Cable", "Housing/Body", "IC Chip", "Camera", "Speaker/Ringer", "Tools/Equipment"];

export default function AdminPartsSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    location: "",
    website: "",
    partTypes: "",
    rating: 5,
    reviewsCount: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Block body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showModal]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/parts-suppliers");
      const data = await res.json();
      if (data && Array.isArray(data.suppliers)) {
        setSuppliers(data.suppliers);
      } else if (Array.isArray(data)) {
        setSuppliers(data);
      }
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      const res = await fetch(`/api/admin/parts-suppliers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuppliers(prev => prev.filter(s => s.id !== id));
      } else {
        alert("Failed to delete supplier");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete supplier");
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    const phoneStr = Array.isArray(supplier.phone) ? supplier.phone.join("\n") : (supplier.phone || "");
    const whatsappStr = Array.isArray(supplier.whatsapp) ? supplier.whatsapp.join("\n") : (supplier.whatsapp || "");
    const partsStr = Array.isArray(supplier.partTypes) ? supplier.partTypes.join(", ") : (supplier.partTypes || "");
    
    setFormData({
      name: supplier.name || "",
      phone: phoneStr,
      whatsapp: whatsappStr,
      location: supplier.location || "",
      website: supplier.website || "",
      partTypes: partsStr,
      rating: supplier.rating || 5,
      reviewsCount: supplier.reviewsCount || 1,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      name: "",
      phone: "",
      whatsapp: "",
      location: "",
      website: "",
      partTypes: DEFAULT_PART_TYPES.slice(0, 4).join(", "),
      rating: 5,
      reviewsCount: 1,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Supplier name is required");
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone.split("\n").map(p => p.trim()).filter(Boolean),
        whatsapp: formData.whatsapp.split("\n").map(p => p.trim()).filter(Boolean),
        location: formData.location,
        website: formData.website,
        partTypes: formData.partTypes.split(",").map(p => p.trim()).filter(Boolean),
        rating: Number(formData.rating) || 5,
        reviewsCount: Number(formData.reviewsCount) || 1,
      };

      const url = editingId ? `/api/admin/parts-suppliers/${editingId}` : "/api/admin/parts-suppliers";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchSuppliers();
      } else {
        alert("Failed to save supplier");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving supplier");
    } finally {
      setSubmitting(false);
    }
  };

  const parseArray = (val?: string[] | string): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return val.split(",").map(s => s.trim()).filter(Boolean);
  };

  const filteredSuppliers = suppliers.filter(s => {
    const query = searchQuery.toLowerCase();
    const phones = parseArray(s.phone);
    const parts = parseArray(s.partTypes);
    
    return (
      (s.name || "").toLowerCase().includes(query) ||
      (s.location || "").toLowerCase().includes(query) ||
      phones.some(p => p.toLowerCase().includes(query)) ||
      parts.some(pt => pt.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <a
              href="/find-parts"
              className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-1"
            >
              &larr; Directory
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Parts Suppliers Admin
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage wholesaler supplier listings shown in Find Parts directory.
              </p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>

        {/* Search & Stats */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by store name, location, or parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Total Suppliers: <span className="font-bold text-gray-900">{suppliers.length}</span>
          </div>
        </div>

        {/* Suppliers Double-Column Grid */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
          {loading ? (
            <div className="p-12 text-center text-gray-500 flex items-center justify-center gap-2.5">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
              <span className="font-medium text-sm">Loading suppliers directory...</span>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-bold text-gray-800 text-base">No suppliers found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Try adjusting your search query or add a new wholesaler supplier.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {filteredSuppliers.map((supplier) => {
                const phoneList = parseArray(supplier.phone);
                const whatsappList = parseArray(supplier.whatsapp);
                const partsList = parseArray(supplier.partTypes);

                return (
                  <div
                    key={supplier.id}
                    className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Header: Store Icon + Name + Rating + Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base flex-shrink-0 border border-indigo-100/60 shadow-2xs">
                          <Building2 className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base leading-snug">{supplier.name}</h3>
                          <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs mt-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{supplier.rating || 5}</span>
                            <span className="text-gray-400 font-normal">({supplier.reviewsCount || 1} reviews)</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                          title="Edit Supplier"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Double Column Info Block (Phone/WhatsApp & Location/Web) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 text-xs text-gray-700">
                      {/* Phone / Contact */}
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <Phone className="w-3 h-3 text-indigo-500" />
                          <span>Phone / Contact</span>
                        </div>
                        {phoneList.length > 0 ? (
                          <div className="space-y-0.5">
                            {phoneList.map((ph, idx) => (
                              <a
                                key={idx}
                                href={`tel:${ph}`}
                                className="block font-medium text-gray-800 hover:text-indigo-600 transition-colors"
                              >
                                {ph}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">No phone added</p>
                        )}

                        {whatsappList.length > 0 && (
                          <div className="pt-1 flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp: {whatsappList[0]}</span>
                          </div>
                        )}
                      </div>

                      {/* Location & Website */}
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-indigo-500" />
                          <span>Location & Web</span>
                        </div>
                        <p className="font-medium text-gray-800 leading-tight">
                          {supplier.location || "Oman"}
                        </p>
                        {supplier.website && (
                          <a
                            href={supplier.website.startsWith("http") ? supplier.website : `https://${supplier.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold mt-0.5"
                          >
                            <Globe className="w-3 h-3" />
                            <span>Website</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Part Types Badges */}
                    {partsList.length > 0 && (
                      <div className="space-y-1 pt-0.5">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          Parts Supplied
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {partsList.map((pt, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-semibold rounded-md border border-indigo-100/60"
                            >
                              {pt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="font-bold text-lg text-gray-900">
                {editingId ? "Edit Supplier" : "Add New Supplier"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gadget Salalah"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Numbers (One per line)</label>
                  <textarea
                    rows={2}
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp (One per line)</label>
                  <textarea
                    rows={2}
                    placeholder="+1 234 567 8900"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. City, Country"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Website URL</label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Part Types (Comma separated)</label>
                <input
                  type="text"
                  placeholder="LCD, Battery, IC Chip, Touch"
                  value={formData.partTypes}
                  onChange={(e) => setFormData({ ...formData, partTypes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingId ? "Update Supplier" : "Create Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
