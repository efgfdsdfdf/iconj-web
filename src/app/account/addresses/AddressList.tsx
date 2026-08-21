"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Trash2, CheckCircle2 } from "lucide-react";
import { deleteAddress, setDefaultAddress } from "./actions";
import { useState } from "react";

export function AddressList({ addresses }: { addresses: any[] }) {
  const [loading, setLoading] = useState<string | null>(null);

  if (addresses.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
          <MapPin className="w-12 h-12 text-slate-300 mb-4" />
          <p>You haven't saved any addresses yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <Card key={address.id} className={\elative overflow-hidden \\}>
          {address.is_default && (
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
              Default
            </div>
          )}
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                  {address.label} 
                </h3>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>{address.street}</p>
                  <p>{address.city}, {address.state}</p>
                  <p className="pt-2 text-slate-500">Phone: {address.phone}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t flex gap-3">
              {!address.is_default && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={async () => {
                    setLoading(\default-\\);
                    await setDefaultAddress(address.id);
                    setLoading(null);
                  }}
                  disabled={loading !== null}
                >
                  {loading === \default-\\ ? 'Saving...' : 'Set Default'}
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={async () => {
                  if(confirm('Are you sure you want to delete this address?')) {
                    setLoading(\delete-\\);
                    await deleteAddress(address.id);
                    setLoading(null);
                  }
                }}
                disabled={loading !== null}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
