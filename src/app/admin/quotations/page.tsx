"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Card, CardContent, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText, Search, Download, AlertCircle, Clock, CheckCircle2, FileWarning
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") {
        if (statusFilter === "EXCEPTIONS") {
          params.append("filter", "exceptions");
        } else {
          params.append("status", statusFilter);
        }
      }
      if (search) params.append("search", search);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`/api/admin/quotations?${params.toString()}`);
      const data = await res.json();
      
      if (res.ok) {
        setQuotations(data.quotations);
        setTotal(data.total);
        if (data.counts) setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [statusFilter, page]); // Only refetch automatically on filter/page change

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuotations();
  };

  const exportData = async () => {
    try {
      const res = await fetch("/api/admin/quotations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export", ids: quotations.map(q => q.id) })
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const csvRows = [];
        const headers = Object.keys(data.data[0]);
        csvRows.push(headers.join(','));
        for (const row of data.data) {
          csvRows.push(headers.map(h => `"${(row as any)[h] || ''}"`).join(','));
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `quotations_export_${new Date().toISOString().split('T')[0]}.csv`);
        a.click();
      }
    } catch (e) {
      alert("Failed to export");
    }
  };

  function getStatusBadge(status: string) {
    switch (status) {
      case 'REQUESTED': return <Badge className="bg-slate-500">New Request</Badge>;
      case 'SUPPLIER_QUOTE_REQUESTED': return <Badge className="bg-purple-500">Sent to Supplier</Badge>;
      case 'SUPPLIER_RESPONSE_RECEIVED': return <Badge className="bg-blue-500">Supplier Responded</Badge>;
      case 'SUPPLIER_SPEC_ISSUE': return <Badge className="bg-red-500">Spec Issue</Badge>;
      case 'QUOTE_BEING_PREPARED': return <Badge className="bg-indigo-500">Drafting</Badge>;
      case 'QUOTE_SENT': return <Badge className="bg-amber-500">Sent to Customer</Badge>;
      case 'QUOTE_VIEWED': return <Badge className="bg-amber-600">Customer Viewed</Badge>;
      case 'QUOTE_ACCEPTED': return <Badge className="bg-emerald-500">Accepted</Badge>;
      case 'PAYMENT_PENDING': return <Badge className="bg-teal-500">Payment Pending</Badge>;
      case 'PAID': return <Badge className="bg-green-600">PAID</Badge>;
      case 'CONVERTED_TO_ORDER': return <Badge variant="outline" className="text-slate-500">Converted</Badge>;
      case 'QUOTE_DECLINED': return <Badge variant="outline" className="text-red-500 border-red-200">Declined</Badge>;
      case 'QUOTE_EXPIRED': return <Badge variant="outline" className="text-slate-500 border-slate-200">Expired</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quotations (RFQ)</h1>
          <p className="text-slate-500">Manage customer quotation requests and supplier orders.</p>
        </div>
        <Button onClick={exportData} variant="outline">
          <Download className="w-4 h-4 mr-2" /> Export View
        </Button>
      </div>

      {/* Dashboard Stats / Inbox Folders */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={`cursor-pointer hover:border-blue-300 transition-colors ${statusFilter === "ALL" ? "border-blue-500 ring-1 ring-blue-500" : ""}`} onClick={() => setStatusFilter("ALL")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><FileText className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Active</p>
              <h3 className="text-2xl font-bold text-slate-900">{total}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`cursor-pointer hover:border-amber-300 transition-colors ${statusFilter === "REQUESTED" ? "border-amber-500 ring-1 ring-amber-500" : ""}`} onClick={() => setStatusFilter("REQUESTED")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><Clock className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">New Requests</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.counts?.REQUESTED || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer hover:border-emerald-300 transition-colors ${statusFilter === "PAID" ? "border-emerald-500 ring-1 ring-emerald-500" : ""}`} onClick={() => setStatusFilter("PAID")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle2 className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Paid & Ready</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats?.counts?.PAID || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer hover:border-red-300 transition-colors ${statusFilter === "EXCEPTIONS" ? "border-red-500 ring-1 ring-red-500" : ""}`} onClick={() => setStatusFilter("EXCEPTIONS")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg"><FileWarning className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Exceptions</p>
              <h3 className="text-2xl font-bold text-red-600">{stats?.exceptionCount || 0}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Quotation Operations Inbox</CardTitle>
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input 
                placeholder="Search reference, email, name..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Active</SelectItem>
                <SelectItem value="REQUESTED">1. New Requests</SelectItem>
                <SelectItem value="SUPPLIER_QUOTE_REQUESTED">2. Sent to Supplier</SelectItem>
                <SelectItem value="SUPPLIER_RESPONSE_RECEIVED">3. Supplier Responded</SelectItem>
                <SelectItem value="QUOTE_AWAITING">4. Awaiting Customer</SelectItem>
                <SelectItem value="QUOTE_ACCEPTED">5. Accepted (Pending Pay)</SelectItem>
                <SelectItem value="PAID">6. Paid (Fulfillment Req.)</SelectItem>
                <SelectItem value="EXCEPTIONS">⚠️ Open Exceptions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : quotations.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No quotations found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                  <tr>
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Next Action / Priority</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{q.reference}</div>
                        <div className="text-xs text-slate-400">{new Date(q.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{q.customer_name}</div>
                        <div className="text-slate-500 text-xs">{q.customer_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 truncate max-w-[200px]" title={q.product_name}>
                          {q.product_name}
                        </div>
                        <div className="text-xs text-slate-500">Qty: {q.quantity}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(q.status)}
                          {q.is_exception && <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50 text-[10px]">⚠️ Exception</Badge>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          {q.priority === 'URGENT' && <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
                          <span className={`text-xs max-w-[250px] leading-tight ${
                            q.priority === 'URGENT' ? 'text-red-700 font-medium' :
                            q.priority === 'NORMAL' ? 'text-blue-700 font-medium' :
                            'text-slate-500'
                          }`}>
                            {q.next_action}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button asChild size="sm" variant={q.priority === 'URGENT' ? 'default' : 'outline'}>
                          <Link href={`/admin/quotations/${q.id}`}>
                            Manage
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {total > limit && (
            <div className="flex justify-between items-center p-4 border-t">
              <p className="text-sm text-slate-500">
                Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
