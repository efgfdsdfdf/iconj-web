"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft, Loader2, Save, Send, AlertCircle, Copy, CheckCircle2, DollarSign, Package, Mail, Clock, RefreshCw, StopCircle
} from "lucide-react";

export default function AdminQuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [q, setQ] = useState<any>(null);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [supplierTotal, setSupplierTotal] = useState("");
  const [markupPct, setMarkupPct] = useState("30");
  const [customerShipping, setCustomerShipping] = useState("");
  const [prodDays, setProdDays] = useState("");
  const [delDays, setDelDays] = useState("");
  const [validDays, setValidDays] = useState("7");
  const [adminNotes, setAdminNotes] = useState("");

  const fetchQuotation = async () => {
    try {
      const res = await fetch(`/api/admin/quotations/${id}`);
      const data = await res.json();
      if (res.ok) {
        setQ(data.quotation);
        setExceptions(data.exceptions);
        setEvents(data.events);
        setEmails(data.emails);
        
        // Init edit fields
        if (data.quotation.supplier_total_cost) setSupplierTotal(data.quotation.supplier_total_cost.toString());
        if (data.quotation.customer_shipping) setCustomerShipping(data.quotation.customer_shipping.toString());
        if (data.quotation.estimated_production_days) setProdDays(data.quotation.estimated_production_days.toString());
        if (data.quotation.estimated_delivery_days) setDelDays(data.quotation.estimated_delivery_days.toString());
        if (data.quotation.admin_notes) setAdminNotes(data.quotation.admin_notes);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const handleUpdate = async (updates: any, actionName: string = "save") => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchQuotation();
      alert(`${actionName} successful`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const calculatePrice = () => {
    const cost = Number(supplierTotal) || 0;
    const markup = Number(markupPct) / 100;
    const calculated = cost * (1 + markup);
    return Math.round(calculated);
  };

  const handleSavePricing = () => {
    const cost = Number(supplierTotal);
    if (!cost) return alert("Enter supplier cost first");
    
    const cPrice = calculatePrice();
    const cShipping = Number(customerShipping) || 0;
    
    // Auto-calculate expiry date
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + Number(validDays));

    handleUpdate({
      supplier_total_cost: cost,
      customer_price: cPrice,
      customer_shipping: cShipping,
      customer_total: cPrice + cShipping,
      estimated_production_days: Number(prodDays) || null,
      estimated_delivery_days: Number(delDays) || null,
      quote_valid_until: expiry.toISOString(),
      admin_notes: adminNotes,
      status: q.status === 'REQUESTED' || q.status === 'SUPPLIER_QUOTE_REQUESTED' || q.status === 'SUPPLIER_RESPONSE_RECEIVED' 
        ? 'QUOTE_BEING_PREPARED' 
        : q.status
    }, "Pricing saved");
  };

  const handleSendQuote = async () => {
    if (!q.customer_total) return alert("Calculate and save pricing first");
    if (!confirm("Are you sure you want to send this quote to the customer?")) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/quotations/${id}/send-quote`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchQuotation();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkSupplierSent = () => {
    handleUpdate({ status: 'SUPPLIER_QUOTE_REQUESTED' }, "Marked as sent to supplier");
  };

  const handleMarkSupplierResponded = () => {
    handleUpdate({ status: 'SUPPLIER_RESPONSE_RECEIVED' }, "Marked as supplier responded");
  };

  const handleMarkFulfillmentSubmitted = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/quotations/${id}/fulfillment`, { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "mark_submitted" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchQuotation();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  };

  const generateSupplierMessage = () => {
    if (!q) return "";
    let specs = "";
    Object.entries(q.specifications || {}).forEach(([k, v]) => {
      if (v !== null && v !== '') {
        const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        specs += `- ${label}: ${v}\n`;
      }
    });
    
    return `Hello,\n\nPlease provide a quote for the following:\n\nProduct: ${q.product_name}\nQuantity: ${q.quantity}\n${q.products?.variants?.supplier_product_url ? `Supplier URL: ${q.products.variants.supplier_product_url}\n` : ""}\nSpecifications:\n${specs}\nDelivery Location: ${q.delivery_location?.state}, Nigeria\n\nPlease let me know the total cost and estimated production time.\n\nThank you,\nICONJ`;
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  if (error || !q) return <div className="p-12 text-center text-red-500">Error: {error}</div>;

  const isLocked = !!q.price_locked_at;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        <Link href="/admin/quotations">Back to Quotations Inbox</Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{q.reference}</h1>
          <p className="text-slate-500">Customer: {q.customer_name} ({q.customer_email})</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className="text-sm px-3 py-1 bg-slate-900">{q.status}</Badge>
          {q.is_exception && <Badge variant="destructive">⚠️ HAS OPEN EXCEPTION</Badge>}
        </div>
      </div>

      <Alert className={q.priority === 'URGENT' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}>
        <AlertCircle className={`h-5 w-5 ${q.priority === 'URGENT' ? 'text-red-600' : 'text-blue-600'}`} />
        <AlertTitle className={q.priority === 'URGENT' ? 'text-red-800' : 'text-blue-800'}>
          Next Action Required
        </AlertTitle>
        <AlertDescription className={q.priority === 'URGENT' ? 'text-red-700 font-medium' : 'text-blue-700'}>
          {q.next_action}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="workflow" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
          <TabsTrigger value="workflow" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">Workflow & Pricing</TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">Customer Details</TabsTrigger>
          <TabsTrigger value="exceptions" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">Exceptions {exceptions.filter(e => e.status !== 'RESOLVED' && e.status !== 'DISMISSED').length > 0 && <span className="ml-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">{exceptions.filter(e => e.status !== 'RESOLVED' && e.status !== 'DISMISSED').length}</span>}</TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-6 py-3">Timeline</TabsTrigger>
        </TabsList>

        {/* WORKFLOW TAB */}
        <TabsContent value="workflow" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Supplier Operations */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="bg-slate-50 border-b pb-4">
                  <CardTitle className="text-lg flex items-center"><Package className="w-5 h-5 mr-2" /> 1. Supplier Interaction</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label className="text-slate-500">Copy-Paste Message for Supplier</Label>
                    <div className="relative mt-1">
                      <Textarea value={generateSupplierMessage()} readOnly className="h-48 bg-slate-50 text-sm font-mono" />
                      <Button size="sm" variant="secondary" className="absolute top-2 right-2" onClick={() => copyToClipboard(generateSupplierMessage())}>
                        <Copy className="w-4 h-4 mr-2" /> Copy
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="w-full" onClick={handleMarkSupplierSent} disabled={saving || q.status !== 'REQUESTED'}>
                      Mark as Sent
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleMarkSupplierResponded} disabled={saving || q.status !== 'SUPPLIER_QUOTE_REQUESTED'}>
                      Mark as Responded
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {q.status === 'PAID' && (
                <Card className="border-green-200 shadow-sm">
                  <CardHeader className="bg-green-50 border-b border-green-100 pb-4">
                    <CardTitle className="text-lg flex items-center text-green-800"><CheckCircle2 className="w-5 h-5 mr-2" /> Fulfillment Order</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <p className="text-sm text-green-700">Customer has paid. Please submit the exact final order to the supplier.</p>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      onClick={handleMarkFulfillmentSubmitted}
                      disabled={saving || q.supplier_fulfillment_status !== 'NOT_SUBMITTED'}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <CheckCircle2 className="w-4 h-4 mr-2"/>}
                      Mark Fulfillment Submitted
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Pricing & Customer Operations */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="bg-slate-50 border-b pb-4">
                  <CardTitle className="text-lg flex items-center"><DollarSign className="w-5 h-5 mr-2" /> 2. Pricing & Preparation</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {isLocked && (
                    <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>Prices are locked because the customer has paid. Modifying supplier costs will trigger a post-payment exception.</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Supplier Total Cost (₦)</Label>
                      <Input type="number" value={supplierTotal} onChange={e => setSupplierTotal(e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Markup % (for calculation)</Label>
                      <Input type="number" value={markupPct} onChange={e => setMarkupPct(e.target.value)} disabled={isLocked} />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border flex justify-between items-center">
                    <span className="text-slate-600">Calculated Product Price:</span>
                    <span className="font-bold text-xl">₦{calculatePrice().toLocaleString('en-NG')}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Customer Shipping (₦)</Label>
                      <Input type="number" value={customerShipping} onChange={e => setCustomerShipping(e.target.value)} disabled={isLocked} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Est. Production (Days)</Label>
                      <Input type="number" value={prodDays} onChange={e => setProdDays(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Est. Delivery (Days)</Label>
                      <Input type="number" value={delDays} onChange={e => setDelDays(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Quote Validity (Days)</Label>
                    <Input type="number" value={validDays} onChange={e => setValidDays(e.target.value)} disabled={isLocked} />
                  </div>

                  <div className="space-y-2">
                    <Label>Admin Internal Notes</Label>
                    <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Not visible to customer" />
                  </div>

                  <Button onClick={handleSavePricing} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>} Save Pricing & Prepare Quote
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="bg-slate-50 border-b pb-4">
                  <CardTitle className="text-lg flex items-center"><Mail className="w-5 h-5 mr-2" /> 3. Send to Customer</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center text-sm border-b pb-4 mb-4">
                    <span className="text-slate-500">Customer Total to Pay:</span>
                    <span className="font-bold text-2xl text-blue-600">
                      ₦{((Number(q.customer_price) || 0) + (Number(q.customer_shipping) || 0)).toLocaleString('en-NG')}
                    </span>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    onClick={handleSendQuote}
                    disabled={saving || !q.customer_total || isLocked}
                  >
                    <Send className="w-5 h-5 mr-2" /> 
                    {q.quote_sent_at ? "Resend Quotation Email" : "Send Quotation to Customer"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* DETAILS TAB */}
        <TabsContent value="details" className="mt-0">
          <Card>
            <CardHeader><CardTitle>Customer Request</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4 border-b pb-2">Specifications</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-500 w-32 inline-block">Product:</span> <span className="font-medium">{q.product_name}</span></p>
                    <p><span className="text-slate-500 w-32 inline-block">Quantity:</span> <span className="font-medium">{q.quantity}</span></p>
                    {Object.entries(q.specifications || {}).map(([k, v]) => (
                      <p key={k}><span className="text-slate-500 w-32 inline-block capitalize">{k.replace(/_/g, ' ')}:</span> <span className="font-medium">{String(v)}</span></p>
                    ))}
                    {q.customer_notes && (
                      <div className="mt-4 p-3 bg-slate-50 rounded">
                        <span className="text-slate-500 block mb-1">Customer Notes:</span>
                        <p>{q.customer_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4 border-b pb-2">Delivery & Contact</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-500 w-32 inline-block">Name:</span> <span className="font-medium">{q.customer_name}</span></p>
                    <p><span className="text-slate-500 w-32 inline-block">Email:</span> <span className="font-medium">{q.customer_email}</span></p>
                    <p><span className="text-slate-500 w-32 inline-block">Phone:</span> <span className="font-medium">{q.customer_phone}</span></p>
                    <div className="mt-4 p-3 bg-slate-50 rounded">
                      <span className="text-slate-500 block mb-1">Address:</span>
                      <p>{q.delivery_location?.address}</p>
                      <p>{q.delivery_location?.city}</p>
                      <p>{q.delivery_location?.state}, {q.delivery_location?.country}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXCEPTIONS TAB */}
        <TabsContent value="exceptions" className="mt-0 space-y-4">
          <div className="flex justify-end mb-4">
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
              <AlertCircle className="w-4 h-4 mr-2" /> Log Manual Exception
            </Button>
          </div>
          
          {exceptions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border rounded-lg bg-slate-50">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No exceptions recorded for this quotation.</p>
            </div>
          ) : (
            exceptions.map(e => (
              <Card key={e.id} className={e.status === 'OPEN' ? 'border-red-200' : ''}>
                <CardHeader className={e.status === 'OPEN' ? 'bg-red-50/50 pb-4 border-b border-red-100' : 'pb-4 border-b'}>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base flex items-center">
                        {e.status === 'OPEN' && <AlertCircle className="w-4 h-4 mr-2 text-red-500" />}
                        {e.exception_type.replace(/_/g, ' ')}
                      </CardTitle>
                      <CardDescription>{new Date(e.created_at).toLocaleString()}</CardDescription>
                    </div>
                    <Badge variant={e.status === 'OPEN' ? 'destructive' : 'outline'}>{e.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-slate-900 mb-4">{e.description}</p>
                  
                  {e.status === 'OPEN' && (
                    <div className="pt-4 border-t flex gap-2">
                      <Button size="sm" variant="outline" className="text-green-600">Resolve Exception</Button>
                      <Button size="sm" variant="ghost" className="text-slate-500">Dismiss</Button>
                    </div>
                  )}
                  {e.resolution_note && (
                    <div className="mt-4 p-3 bg-slate-50 text-sm rounded border">
                      <span className="font-semibold text-slate-700">Resolution Note:</span> {e.resolution_note}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* TIMELINE TAB */}
        <TabsContent value="timeline" className="mt-0">
          <Card>
            <CardHeader><CardTitle>Event Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-6">
                {events.map((e, idx) => (
                  <div key={e.id} className="relative pl-6 pb-6 border-l last:pb-0 last:border-0 border-slate-200">
                    <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" />
                    <p className="text-sm font-semibold text-slate-900">{e.event_type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-slate-600 mt-1">{e.description}</p>
                    <p className="text-xs text-slate-400 mt-2">{new Date(e.created_at).toLocaleString()} • by {e.performed_by}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
