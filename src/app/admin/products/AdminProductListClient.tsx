"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Edit, Download, FileText } from "lucide-react";
import { DeleteProductButton } from "./DeleteProductButton";
import { DdpEstimateModal } from "./DdpEstimateModal";

export function AdminProductListClient({ products, search }: { products: any[], search: string }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <>
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
          <span className="font-medium">{selectedIds.length} products selected</span>
          <div className="h-5 w-px bg-slate-700" />
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-500 text-white border-0"
            onClick={() => setModalOpen(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate DDP Estimate Request
          </Button>
          <button 
            onClick={() => setSelectedIds([])}
            className="text-slate-400 hover:text-white text-sm underline underline-offset-4 ml-2"
          >
            Clear
          </button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 pl-4">
              <Checkbox 
                checked={products.length > 0 && selectedIds.length === products.length} 
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Supplier Cost</TableHead>
            <TableHead>Selling Price</TableHead>
            <TableHead>Margin</TableHead>
            <TableHead className="text-right pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products?.map((product: any) => (
            <TableRow key={product.id} className={selectedIds.includes(product.id) ? "bg-blue-50/50" : ""}>
              <TableCell className="pl-4">
                <Checkbox 
                  checked={selectedIds.includes(product.id)} 
                  onCheckedChange={() => toggleSelect(product.id)}
                />
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="text-xs text-slate-500">{product.sku}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>₦{Number(product.base_supplier_cost).toLocaleString()}</TableCell>
              <TableCell className="font-bold text-slate-900">₦{Number(product.base_selling_price).toLocaleString()}</TableCell>
              <TableCell className="text-emerald-600 font-medium bg-emerald-50/50">
                {product.base_selling_price > 0 ? Math.round(((product.base_selling_price - product.base_supplier_cost) / product.base_selling_price) * 100) : 0}%
              </TableCell>
              <TableCell className="text-right pr-6 flex justify-end items-center gap-2">
                <Link href={`/admin/products/${product.id}/edit`} className="text-blue-500 hover:text-blue-700 p-2 rounded hover:bg-blue-50 transition-colors" title="Edit Product">
                  <Edit className="w-4 h-4" />
                </Link>
                <DeleteProductButton productId={product.id} />
              </TableCell>
            </TableRow>
          ))}
          {(!products || products.length === 0) && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                {search ? `No products found matching "${search}"` : "No products found in database."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <DdpEstimateModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        selectedProductIds={selectedIds}
      />
    </>
  );
}
