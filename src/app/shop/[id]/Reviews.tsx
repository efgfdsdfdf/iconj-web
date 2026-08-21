
import { Star, CheckCircle2 } from "lucide-react";

export function Reviews() {
  const reviews = [
    { name: "Chinedu O.", date: "2 days ago", rating: 5, comment: "Excellent quality! The motorized blinds work perfectly with my smart home setup. Delivery to Abuja was faster than expected.", verified: true },
    { name: "Sarah M.", date: "1 week ago", rating: 5, comment: "Direct factory pricing is real. Saved a lot compared to buying locally in Lagos. Will definitely order again for my new apartment.", verified: true },
    { name: "David A.", date: "3 weeks ago", rating: 4, comment: "Good materials and accurate dimensions. The only issue was a slight delay in shipping, but the customer support kept me updated.", verified: true },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mt-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <h2 className="text-xl font-bold text-slate-900">Customer Reviews</h2>
        <div className="flex items-center gap-2">
          <div className="flex text-amber-400"><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/><Star className="w-4 h-4 fill-current"/></div>
          <span className="font-bold text-slate-900">4.8</span>
          <span className="text-slate-500 text-sm">(24 reviews)</span>
        </div>
      </div>
      
      <div className="space-y-6">
        {reviews.map((r, idx) => (
          <div key={idx} className="border-b last:border-0 pb-6 last:pb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">{r.name}</p>
                  {r.verified && <p className="text-[10px] text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified Buyer</p>}
                </div>
              </div>
              <span className="text-xs text-slate-400">{r.date}</span>
            </div>
            <div className="flex text-amber-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-current" : "text-slate-200"}`} />
              ))}
            </div>
            <p className="text-sm text-slate-700">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

