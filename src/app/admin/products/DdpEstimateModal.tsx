"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Download, Check } from "lucide-react";
import { getProductsForDdpEstimate } from "./actions";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Document, Packer, Paragraph, TextRun, ExternalHyperlink, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel } from "docx";

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
    let text = `ICONJ - NIGERIA DDP ESTIMATE REQUEST\n\n`;
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

  const handleDownloadWord = async () => {
    try {
      const children: any[] = [
        new Paragraph({
          text: "ICONJ - NIGERIA DDP ESTIMATE REQUEST",
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: `Date: ${new Date().toLocaleDateString()}`,
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: `Products Included: ${data.length}`,
          spacing: { after: 400 },
        }),
        new Paragraph({
          text: "The requested amounts are estimates for pricing purposes. Final DDP costs will be based on actual shipment costs/invoices.",
          spacing: { after: 400 },
        }),
      ];

      data.forEach((p, index) => {
        children.push(
          new Paragraph({
            text: `PRODUCT ${index + 1}`,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 400, after: 200 },
          })
        );

        const addField = (label: string, value: string, linkUrl?: string) => {
          const safeVal = value || "Not provided";
          if (linkUrl && safeVal !== "Not provided" && safeVal !== "MISSING") {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${label} `, bold: true }),
                  new ExternalHyperlink({
                    children: [
                      new TextRun({
                        text: safeVal,
                        style: "Hyperlink",
                      }),
                    ],
                    link: safeVal,
                  }),
                ],
                spacing: { after: 100 },
              })
            );
          } else {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${label} `, bold: true }),
                  new TextRun({ text: safeVal }),
                ],
                spacing: { after: 100 },
              })
            );
          }
        };

        addField("Product Name:", p.name);
        addField("Product ID/SKU:", `${p.id} / ${p.sku}`);
        addField("ICONJ Product URL:", p.iconjUrl, true);
        addField("Alibaba Supplier URL:", p.alibabaUrl, true);
        addField("Standard Size:", p.standardSize);
        addField("Requested Quantity:", p.quantity);
        addField("Product Weight:", p.productWeight);
        addField("Package Dimensions:", p.packageDimensions);
        addField("Package Weight:", p.packageWeight);
        addField("Variant Info:", p.variantInfo);
        
        children.push(
          new Paragraph({
            text: "--------------------------------------------------",
            spacing: { before: 200, after: 200 },
          })
        );
      });

      children.push(
        new Paragraph({
          text: "SUPPLIER RESPONSE TABLE",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );

      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "Product", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: "Std Size", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: "Qty", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: "Est. DDP Cost", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: "Courier", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: "Supplier Notes", bold: true })] }),
          ],
        }),
      ];

      data.forEach((p, i) => {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(`Prod ${i + 1}`)] }),
              new TableCell({ children: [new Paragraph(p.standardSize !== "Not provided" ? p.standardSize.substring(0, 15) : "-")] }),
              new TableCell({ children: [new Paragraph("1")] }),
              new TableCell({ children: [new Paragraph("")] }),
              new TableCell({ children: [new Paragraph("")] }),
              new TableCell({ children: [new Paragraph("")] }),
            ],
          })
        );
      });

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
        })
      );

      children.push(
        new Paragraph({
          text: "DDP Estimate Request Note:",
          bold: true,
          spacing: { before: 400, after: 100 },
        })
      );
      children.push(
        new Paragraph({
          text: "The requested DDP amounts are estimates for ICONJ's standard product pricing. The supplier has advised that the final DDP cost may vary depending on actual package dimensions, weight, courier selection, shipping conditions, taxes and other applicable costs.",
          spacing: { after: 100 },
        })
      );

      const doc = new Document({
        sections: [{ properties: {}, children }],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ICONJ_DDP_Estimate_Request.docx";
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Failed to generate Word document: ", err);
      alert("Failed to generate Word document. Please try copying the text instead.");
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("ICONJ - NIGERIA DDP ESTIMATE REQUEST", 14, 20);
      
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
          const safeVal = value ? String(value) : "Not provided";
          const lines = doc.splitTextToSize(safeVal, 120);
          
          if (isLink && safeVal !== "Not provided" && safeVal !== "MISSING") {
            doc.setTextColor(0, 0, 255);
            doc.text(lines, 65, yPos);
            doc.link(65, yPos - 4, 120, lines.length * 5, { url: safeVal });
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
      
      autoTable(doc, {
        startY: yPos,
        head: [['Product', 'Std Size', 'Qty', 'Est. DDP Cost', 'Courier', 'Supplier Notes']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
      });
      
      // @ts-ignore
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
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
    } catch (err) {
      console.error("Failed to generate PDF: ", err);
      alert("Failed to generate PDF document. Please try copying the text instead.");
    }
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
              {copied ? "Copied!" : "Copy Text"}
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700" 
              onClick={handleDownloadWord}
              disabled={loading || data.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Word (.docx)
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={handleDownloadPDF}
              disabled={loading || data.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF (.pdf)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
