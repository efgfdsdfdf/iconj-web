"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Trash2, Plus, Upload, CheckCircle2 } from "lucide-react";
import { uploadProductImage, updateCategories } from "@/app/admin/actions";

export function CategoryEditorClient({ initialCategories }: { initialCategories: { name: string, icon: string }[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCategory = () => {
    setCategories([...categories, { name: "New Category", icon: "" }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, field: string, value: string) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadProductImage(formData);
      if (res.success && res.url) {
        updateCategory(index, "icon", res.url);
      } else {
        alert(res.error || "Upload failed");
      }
    } catch (err: any) {
      alert("Error uploading image");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const res = await updateCategories(categories);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(res.error || "Failed to save categories");
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-600 p-3 rounded mb-4 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Categories updated successfully on the homepage!</div>}

        <div className="space-y-4 mb-6">
          {categories.map((cat, i) => (
            <div key={i} className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border">
              <GripVertical className="w-5 h-5 text-slate-400 cursor-move" />
              
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white bg-slate-200 shrink-0 relative group">
                {cat.icon ? (
                  <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">No Img</div>
                )}
                <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Upload className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && handleImageUpload(i, e.target.files[0])} />
                </label>
              </div>

              <div className="flex-1">
                <Input 
                  value={cat.name} 
                  onChange={e => updateCategory(i, "name", e.target.value)} 
                  placeholder="Category Name" 
                  className="font-bold"
                />
              </div>

              <Button variant="ghost" size="icon" onClick={() => removeCategory(i)} className="text-red-500 hover:bg-red-50">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center border-t pt-4">
          <Button variant="outline" onClick={addCategory} className="gap-2">
            <Plus className="w-4 h-4" /> Add Category
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-32">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

