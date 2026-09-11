"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Download, Check } from "lucide-react";
import { getProductsForDdpEstimate } from "./actions";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface DdpEstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductIds: string[];
}

export function DdpEstimateModal({ isOpen, onClose, selectedProductIds }: DdpEstimateModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && selectedProductIds.length > 0) {
      setLoading(true);
      getProductsForDdpEstimate(selectedProductIds)
        .then(res => setData(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, selectedProductIds]);

  const generateText = () => {
    let text = `ICONJ — NIGERIA DDP ESTIMATE REQUEST\n\n`;
    text += `Hello, please provide an estimated DDP cost to Nigeria for the products below.\n\n`;
    text += `The estimates are for our standard-size product listings.\n`;
    text += `Please calculate based on the actual product/package dimensions, weight, quantity and the most appropriate/lowest-cost courier available.\n`;
    text += `For each product, please provide the estimated DDP cost for door-to-door delivery to a customer's address in Nigeria.\n\n`;
    text += `We understand that the final DDP amount may differ from the estimate and that the final actual shipping/tax costs will be based on the actual shipment and invoices.\n\n`;
    
    data.forEach((p, index) => {
      text += `PRODUCT ${index + 1}\n\n`;
      text += `Product:\n${p.name}\n\n`;
      text += `Product ID/SKU:\n${p.id} / ${p.sku}\n\n`;
      text += `ICONJ Product:\n${p.iconjUrl}\n\n`;
      text += `Alibaba Supplier Product:\n${p.alibabaUrl}\n\n`;
      text += `Standard Size:\n${p.standardSize}\n\n`;
      text += `Quantity:\n${p.quantity}\n\n`;
      text += `Product Weight:\n${p.productWeight}\n\n`;
      text += `Package Dimensions:\n${p.packageDimensions}\n\n`;
      text += `Package Weight:\n${p.packageWeight}\n\n`;
      text += `Variant:\n${p.variantInfo}\n\n`;
      text += `--------------------------------------------------\n\n`;
    });
    
    text += `Please provide for each product:\n`;
    text += `1. Estimated DDP cost to Nigeria\n`;
    text += `2. Estimated shipping/courier method if known\n`;
    text += `3. Any assumptions used for the estimate\n`;
    text += `4. Any information you need from us to make the estimate more accurate\n\n`;
    text += `Thank you.\n`;
    return text;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ICONJ — NIGERIA DDP ESTIMATE REQUEST", 14, 20);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Standard Product DDP Cost Estimation", 14, 28);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);
    doc.text(`Products Included: ${data.length}`, 14, 42);
    
    doc.setFontSize(9);
    doc.setTextColor(80);
    const introText = "The requested amounts are estimates for pricing purposes. Final DDP costs will be based on actual shipment costs/invoices.";
    doc.text(introText, 14, 50, { maxWidth: 180 });
    
    let yPos = 65;
    
    data.forEach((p, index) => {
      // Check if we need a new page
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(`PRODUCT ${index + 1}`, 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const printLine = (label: string, value: string, isLink: boolean = false) => {
        if (yPos > 275) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text(label, 14, yPos);
        
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(value, 120);
        
        if (isLink && value !== "Not provided" && value !== "MISSING") {
          doc.setTextColor(0, 0, 255);
          doc.textWithLink(lines, 65, yPos, { url: value });
          doc.setTextColor(0);
        } else {
          doc.text(lines, 65, yPos);
        }
        
        yPos += (lines.length * 5) + 3;
      };
      
      printLine("Product Name:", p.name);
      printLine("Product ID/SKU:", `${p.id} / ${p.sku}`);
      printLine("ICONJ Product URL:", p.iconjUrl, true);
      printLine("Alibaba Supplier URL:", p.alibabaUrl, true);
      printLine("Standard Size:", p.standardSize);
      printLine("Requested Quantity:", p.quantity);
      printLine("Product Weight:", p.productWeight);
      printLine("Package Dimensions:", p.packageDimensions);
      printLine("Package Weight:", p.packageWeight);
      printLine("Variant Info:", p.variantInfo);
      
      yPos += 5; // Spacing between products
      doc.setDrawColor(200);
      doc.line(14, yPos, 196, yPos);
      yPos += 10;
    });
    
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }
    
    // Supplier Response Table
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SUPPLIER RESPONSE TABLE", 14, yPos);
    yPos += 5;
    
    const tableData = data.map((p, i) => [
      `Prod ${i + 1}`, 
      p.standardSize !== "Not provided" ? p.standardSize.substring(0, 15) : "-", 
      "1", 
      "", 
      "", 
      ""
    ]);
    
    // @ts-ignore - jspdf-autotable extends jsPDF but ts doesn't always know
    doc.autoTable({
      startY: yPos,
      head: [['Product', 'Std Size', 'Qty', 'Est. DDP Cost', 'Courier', 'Supplier Notes']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 }
    });
    
    // @ts-ignore
    yPos = doc.lastAutoTable.finalY + 15;
    
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DDP Estimate Request Note:", 14, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80);
    const disclaimer = "The requested DDP amounts are estimates for ICONJ's standard product pricing. The supplier has advised that the final DDP cost may vary depending on actual package dimensions, weight, courier selection, shipping conditions, taxes and other applicable costs. Final actual shipping and tax costs will be supported by the relevant invoices provided by the supplier/logistics provider.";
    doc.text(disclaimer, 14, yPos, { maxWidth: 180 });
    
    doc.save("ICONJ_DDP_Estimate_Request.pdf");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>DDP Estimate Request</DialogTitle>
          <DialogDescription>
            {selectedProductIds.length} products selected for estimation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 my-4 bg-slate-50 p-4 rounded border font-mono text-sm whitespace-pre-wrap">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>Fetching secure supplier data...</p>
            </div>
          ) : (
            generateText()
          )}
        </div>

        <DialogFooter className="flex items-center sm:justify-between border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="bg-slate-100 hover:bg-slate-200" 
              onClick={handleCopy}
              disabled={loading || data.length === 0}
            >
              {copied ? <Check className="w-4 h-4 mr-2 text-emerald-600" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy Request Text"}
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={handleDownloadPDF}
              disabled={loading || data.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Download DDP Estimate PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
