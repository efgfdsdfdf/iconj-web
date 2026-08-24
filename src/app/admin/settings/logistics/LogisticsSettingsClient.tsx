"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, CheckCircle, Package } from "lucide-react";
import { upsertForwarder, deleteForwarder } from "./actions";

export function LogisticsSettingsClient({ initialForwarders }: { initialForwarders: any[] }) {
  const [forwarders, setForwarders] = useState(initialForwarders);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddNew = () => {
    setFormData({
      company_name: "", contact_person: "", email: "", phone: "",
      china_warehouse_name: "", china_warehouse_address: "", china_warehouse_contact: "",
      china_warehouse_phone: "", iconj_account_code: "",
      air_freight_rate: 0, sea_freight_rate: 0, min_chargeable_weight: 0,
      processing_time: "", transit_time: "", nigeria_delivery_method: "", notes: "",
      is_active: false
    });
    setIsEditing(true);
  };

  const handleEdit = (f: any) => {
    setFormData({ ...f });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await upsertForwarder(formData);
      if (res.success) {
        window.location.reload();
      } else {
        alert("Failed to save: " + res.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this freight forwarder?")) return;
    const res = await deleteForwarder(id);
    if (res.success) window.location.reload();
    else alert("Failed to delete: " + res.error);
  };

  const handleSetActive = async (f: any) => {
    setIsLoading(true);
    await upsertForwarder({ ...f, is_active: true });
    window.location.reload();
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{formData.id ? "Edit Freight Forwarder" : "Add Freight Forwarder"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Company Details</h3>
                <div>
                  <Label>Company Name *</Label>
                  <Input required value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
                </div>
                <div>
                  <Label>ICONJ Account Code *</Label>
                  <Input required value={formData.iconj_account_code} onChange={e => setFormData({...formData, iconj_account_code: e.target.value})} placeholder="e.g. ICONJ-1029" />
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <Input value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">China Warehouse (Shipping Destination)</h3>
                <div>
                  <Label>Warehouse Name</Label>
                  <Input value={formData.china_warehouse_name} onChange={e => setFormData({...formData, china_warehouse_name: e.target.value})} placeholder="e.g. Guangzhou Central Hub" />
                </div>
                <div>
                  <Label>Warehouse Full Address *</Label>
                  <textarea 
                    required
                    className="w-full min-h-[100px] p-3 rounded-md border border-slate-200"
                    value={formData.china_warehouse_address} 
                    onChange={e => setFormData({...formData, china_warehouse_address: e.target.value})} 
                    placeholder="Enter the exact Chinese shipping address for suppliers..."
                  />
                </div>
                <div>
                  <Label>Warehouse Contact Person</Label>
                  <Input value={formData.china_warehouse_contact} onChange={e => setFormData({...formData, china_warehouse_contact: e.target.value})} />
                </div>
                <div>
                  <Label>Warehouse Phone</Label>
                  <Input value={formData.china_warehouse_phone} onChange={e => setFormData({...formData, china_warehouse_phone: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Forwarder"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Configured Forwarders</h2>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Forwarder
        </Button>
      </div>

      {forwarders.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 bg-slate-50 border-dashed">
          <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>No freight forwarders configured.</p>
          <p className="text-sm">Add your China logistics partner to automate supplier shipping addresses.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {forwarders.map(f => (
            <Card key={f.id} className={f.is_active ? "border-green-500 ring-1 ring-green-500" : ""}>
              <CardContent className="p-6 flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold">{f.company_name}</h3>
                    {f.is_active && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> ACTIVE DEFAULT</span>}
                  </div>
                  <p className="text-sm text-slate-600"><strong>Account Code:</strong> {f.iconj_account_code}</p>
                  <div className="p-3 bg-slate-50 rounded-md border mt-3">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">China Warehouse Address</p>
                    <p className="text-sm whitespace-pre-wrap font-mono">{f.china_warehouse_address}</p>
                    <p className="text-sm mt-2 text-slate-600">Contact: {f.china_warehouse_contact || "N/A"} | Phone: {f.china_warehouse_phone || "N/A"}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 justify-start min-w-[150px]">
                  {!f.is_active && (
                    <Button variant="outline" className="w-full text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleSetActive(f)} disabled={isLoading}>
                      Set as Active
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => handleEdit(f)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button variant="outline" className="w-full text-red-600 hover:bg-red-50" onClick={() => handleDelete(f.id)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
