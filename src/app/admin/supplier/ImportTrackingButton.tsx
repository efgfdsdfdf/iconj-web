"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2 } from "lucide-react";
import { importTrackingData } from "./actions";

export function ImportTrackingButton() {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvData = event.target?.result as string;
        // Parse CSV simple way
        const rows = csvData.split('\n').map(row => row.split(','));
        // Find headers
        const headers = rows[0].map(h => h.trim().toLowerCase());
        
        const orderIdIndex = headers.findIndex(h => h.includes('order id') || h.includes('order ref'));
        const trackingIndex = headers.findIndex(h => h.includes('tracking'));
        const carrierIndex = headers.findIndex(h => h.includes('carrier'));

        if (orderIdIndex === -1 || trackingIndex === -1) {
          alert("Invalid CSV format. Please ensure it has an 'Order ID' and a 'Tracking Number' column.");
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        const updates = [];
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i] || rows[i].length < 2) continue;
          
          const rawOrderId = rows[i][orderIdIndex]?.trim();
          if (!rawOrderId) continue;
          
          // Remove ICONJ- prefix if the supplier kept it
          const cleanId = rawOrderId.replace(/^ICONJ-/, '');
          
          const tracking = rows[i][trackingIndex]?.trim();
          const carrier = carrierIndex !== -1 ? rows[i][carrierIndex]?.trim() : 'Standard';

          // Only process rows that have actual tracking numbers
          if (cleanId && tracking && tracking !== '""' && tracking !== '') {
            updates.push({ id: cleanId, tracking, carrier });
          }
        }

        if (updates.length > 0) {
          const result = await importTrackingData(updates);
          if (result.success) {
            alert(`Successfully imported ${result.count} tracking numbers! Orders marked as Shipped.`);
          } else {
            alert("Error importing tracking data: " + result.error);
          }
        } else {
          alert("No valid tracking numbers found in the CSV. Make sure the supplier filled out the tracking column.");
        }
      } catch (err: any) {
        alert("Error parsing file: " + err.message);
      }
      
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        id="csv-upload"
      />
      <Button 
        variant="outline" 
        disabled={loading}
        onClick={() => document.getElementById('csv-upload')?.click()}
      >
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
        {loading ? 'Processing CSV...' : 'Import Tracking CSV'}
      </Button>
    </div>
  );
}
