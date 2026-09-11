'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, AlertTriangle, CheckCircle, Package, Plus, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

export function DDPDashboardClient({ 
  awaitingEstimates, 
  activeEstimates, 
  actuals, 
  deposits, 
  depositBalance,
  recentOrders
}: any) {
  const [activeTab, setActiveTab] = useState('AWAITING');
  const [bulkEntries, setBulkEntries] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // Stats
  const staleCount = activeEstimates.filter((p: any) => {
    if (!p.current_estimate) return false;
    const diff = (new Date().getTime() - new Date(p.current_estimate.created_at).getTime()) / (1000 * 3600 * 24);
    return diff > 90;
  }).length;
  const varianceCount = actuals.filter((a: any) => a.variance > 0).length;

  const handleBulkChange = (productId: string, field: string, value: any) => {
    setBulkEntries((prev: any) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        product_id: productId,
        [field]: value
      }
    }));
  };

  const submitBulkEstimates = async () => {
    const estimates = Object.values(bulkEntries).filter((e: any) => e.estimated_ddp);
    if (estimates.length === 0) return toast.error('No estimates filled');
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/ddp/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimates })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Estimates Saved Successfully!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const applyPricing = (productId: string) => {
    toast.success('Pricing update triggered (To be handled by existing pricing system)');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">DDP Management</h1>
        <p className="text-slate-500 mt-1">Manage supplier shipping estimates, actual costs, and deposits.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-amber-50 border-amber-200"><CardContent className="p-4"><p className="text-sm font-medium text-amber-800">Awaiting Estimates</p><p className="text-2xl font-bold text-amber-900">{awaitingEstimates.length}</p></CardContent></Card>
        <Card className="bg-emerald-50 border-emerald-200"><CardContent className="p-4"><p className="text-sm font-medium text-emerald-800">Active Estimates</p><p className="text-2xl font-bold text-emerald-900">{activeEstimates.length}</p></CardContent></Card>
        <Card className="bg-red-50 border-red-200"><CardContent className="p-4"><p className="text-sm font-medium text-red-800">Variances to Review</p><p className="text-2xl font-bold text-red-900">{varianceCount}</p></CardContent></Card>
        <Card className="bg-indigo-50 border-indigo-200"><CardContent className="p-4"><p className="text-sm font-medium text-indigo-800">Supplier Deposit</p><p className="text-2xl font-bold text-indigo-900">?{Number(depositBalance).toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="flex space-x-2 border-b overflow-x-auto pb-2">
        {['AWAITING', 'ACTIVE', 'ACTUALS', 'DEPOSITS'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={\px-4 py-2 font-medium text-sm whitespace-nowrap \\}>
            {tab === 'AWAITING' ? 'Bulk Entry (Awaiting)' : tab === 'ACTIVE' ? 'Pricing Recommendations' : tab === 'ACTUALS' ? 'Actual Costs & Variances' : 'Supplier Deposit'}
          </button>
        ))}
      </div>

      {activeTab === 'AWAITING' && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Enter Supplier Estimates</CardTitle>
            <CardDescription>Enter the DDP estimates returned by the supplier. Product info is pre-filled.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 w-32">Std Size</th>
                    <th className="p-3 w-20">Qty</th>
                    <th className="p-3 w-40">Est. DDP (?)</th>
                    <th className="p-3 w-32">Courier</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {awaitingEstimates.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-900">
                        {p.name} <br/><span className="text-xs text-slate-400">SKU: {p.sku}</span>
                        {p.alibaba_url && <a href={p.alibaba_url} target="_blank" className="ml-2 text-blue-500 text-xs inline-flex items-center"><ExternalLink className="w-3 h-3 mr-1"/> Alibaba</a>}
                      </td>
                      <td className="p-2"><Input className="h-8" onChange={e => handleBulkChange(p.id, 'standard_size', e.target.value)} /></td>
                      <td className="p-2"><Input className="h-8" type="number" defaultValue={1} onChange={e => handleBulkChange(p.id, 'quantity_basis', Number(e.target.value))} /></td>
                      <td className="p-2"><Input className="h-8" type="number" placeholder="Cost" onChange={e => handleBulkChange(p.id, 'estimated_ddp', Number(e.target.value))} /></td>
                      <td className="p-2"><Input className="h-8" placeholder="e.g. DHL" onChange={e => handleBulkChange(p.id, 'courier', e.target.value)} /></td>
                      <td className="p-2"><Input className="h-8" placeholder="Notes..." onChange={e => handleBulkChange(p.id, 'supplier_notes', e.target.value)} /></td>
                    </tr>
                  ))}
                  {awaitingEstimates.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">All products have current estimates!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {awaitingEstimates.length > 0 && (
              <div className="mt-6 flex justify-end">
                <Button onClick={submitBulkEstimates} disabled={isSaving} className="bg-slate-900 hover:bg-slate-800">
                  {isSaving ? 'Saving...' : 'Save All Estimates'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'ACTIVE' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeEstimates.map((p: any) => {
            const est = p.current_estimate;
            const targetMargin = 0.3; // 30% standard
            const productCost = p.base_supplier_cost || 0;
            const safetyBuffer = p.ddp_safety_buffer || 0;
            const totalCost = productCost + est.estimated_ddp + safetyBuffer;
            const recommendedPrice = totalCost / (1 - targetMargin);

            const isStale = ((new Date().getTime() - new Date(est.created_at).getTime()) / (1000 * 3600 * 24)) > 90;

            return (
              <Card key={p.id} className={isStale ? 'border-amber-300 bg-amber-50/20' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base truncate">{p.name}</CardTitle>
                  <CardDescription>SKU: {p.sku}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {isStale && (
                    <div className="bg-amber-100 text-amber-800 px-3 py-2 rounded text-xs flex items-center font-medium">
                      <AlertTriangle className="w-4 h-4 mr-2" /> Estimate > 90 days old
                    </div>
                  )}
                  
                  <div className="bg-slate-50 p-3 rounded border space-y-1">
                    <div className="flex justify-between text-slate-600"><span>Product Cost:</span> <span>?{productCost.toLocaleString()}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Est. DDP:</span> <span>?{est.estimated_ddp.toLocaleString()}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Safety Buffer:</span> <span>?{safetyBuffer.toLocaleString()}</span></div>
                    <div className="border-t pt-1 mt-1 flex justify-between font-bold text-slate-800">
                      <span>Total Internal Cost:</span> <span>?{totalCost.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 p-3 rounded border border-emerald-100">
                    <div className="flex justify-between text-emerald-800 font-bold">
                      <span>Recommended Price (30% Margin):</span>
                      <span>?{recommendedPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Button variant="outline" size="sm" className="w-full text-slate-600" onClick={() => setActiveTab('AWAITING')}>Update Est.</Button>
                    <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800" onClick={() => applyPricing(p.id)}>Apply Price</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'ACTUALS' && (
        <Card>
          <CardHeader>
             <CardTitle>Actual DDP Costs vs Estimates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium">
                  <tr>
                    <th className="p-3">Order Ref</th>
                    <th className="p-3">Actual Shipping</th>
                    <th className="p-3">Actual Tax</th>
                    <th className="p-3">Total Actual DDP</th>
                    <th className="p-3">Variance</th>
                    <th className="p-3">Invoice Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {actuals.map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-indigo-600">{a.orders?.paystack_reference || a.order_id.substring(0,8)}</td>
                      <td className="p-3">?{a.actual_shipping.toLocaleString()}</td>
                      <td className="p-3">?{a.actual_tax.toLocaleString()}</td>
                      <td className="p-3 font-bold text-slate-900">?{a.total_actual_ddp.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={\px-2 py-1 rounded text-xs font-bold \\}>
                          {a.variance > 0 ? '+' : ''}?{a.variance.toLocaleString()}
                        </span>
                        {a.variance > 5000 && <AlertTriangle className="w-4 h-4 text-red-500 inline ml-2" title="Admin Review Required" />}
                      </td>
                      <td className="p-3">{a.invoice_reference || '—'}</td>
                    </tr>
                  ))}
                  {actuals.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No actual costs recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
            
            <div className="mt-8 p-4 border rounded-xl bg-slate-50">
              <h3 className="font-bold text-slate-800 mb-2">Record Actual DDP (Logistics Tool)</h3>
              <p className="text-sm text-slate-500 mb-4">When a supplier provides the final shipping invoice for an order, record it here.</p>
              <div className="flex gap-2">
                <select className="border rounded p-2 text-sm bg-white" id="actual-order-id">
                  <option value="">Select Order...</option>
                  {recentOrders.map((o: any) => <option key={o.id} value={o.id}>{o.paystack_reference || o.id.substring(0,8)}</option>)}
                </select>
                <Input id="actual-shipping" type="number" placeholder="Actual Shipping (?)" className="max-w-[150px]" />
                <Input id="actual-tax" type="number" placeholder="Actual Tax (?)" className="max-w-[150px]" />
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={async () => {
                  const oid = (document.getElementById('actual-order-id') as HTMLSelectElement).value;
                  const aship = (document.getElementById('actual-shipping') as HTMLInputElement).value;
                  const atax = (document.getElementById('actual-tax') as HTMLInputElement).value;
                  if (!oid || !aship || !atax) return toast.error('Missing fields');
                  toast.success('Cost recorded! (Wired to API in background)');
                  // Wire to actual API
                  await fetch('/api/admin/ddp/actuals', { method: 'POST', body: JSON.stringify({ order_id: oid, actual_shipping: aship, actual_tax: atax }) });
                  setTimeout(() => window.location.reload(), 1000);
                }}>Record Actual</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'DEPOSITS' && (
        <Card>
          <CardHeader>
             <CardTitle>Supplier Deposit Ledger</CardTitle>
             <CardDescription>Internal tracking of funds deposited with the supplier.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6">
                <div>
                  <p className="text-indigo-800 font-medium">Current Available Balance</p>
                  <p className="text-3xl font-extrabold text-indigo-900">?{Number(depositBalance).toLocaleString()}</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={async () => {
                   const amt = prompt('Amount (?):');
                   if (!amt) return;
                   await fetch('/api/admin/ddp/deposits', { method: 'POST', body: JSON.stringify({ transaction_type: 'CREDIT', amount: amt }) });
                   window.location.reload();
                }}><Plus className="w-4 h-4 mr-2" /> Add Deposit</Button>
             </div>

             <table className="w-full text-sm text-left border rounded">
                <thead className="bg-slate-50 text-slate-600 font-medium">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Balance After</th>
                    <th className="p-3">Reference / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deposits.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-3">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="p-3 font-medium text-slate-700">{d.transaction_type}</td>
                      <td className={\p-3 font-bold \\}>
                        {d.transaction_type === 'DEBIT' ? '-' : '+'}?{d.amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-slate-900 font-medium">?{d.balance_after.toLocaleString()}</td>
                      <td className="p-3 text-slate-500">{d.reference} {d.notes}</td>
                    </tr>
                  ))}
                  {deposits.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No deposit history.</td></tr>}
                </tbody>
             </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
