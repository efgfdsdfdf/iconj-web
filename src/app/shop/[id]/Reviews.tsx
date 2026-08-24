"use client";

import { useState } from "react";
import { Star, CheckCircle2, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addReview } from "@/app/admin/actions";

export function Reviews({ productId, initialReviews = [] }: { productId: string, initialReviews?: any[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [isWriting, setIsWriting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const defaultReviews = [
    { name: "Chinedu O.", date: "2 days ago", rating: 5, comment: "Excellent quality! The motorized zebra blinds fit my window perfectly and the installation was very professional. Delivery to Abuja was faster than expected.", verified: true },
    { name: "Sarah M.", date: "1 week ago", rating: 5, comment: "Direct factory pricing is real. Saved a lot compared to buying locally in Lagos. Will definitely order again for my new apartment.", verified: true },
  ];

  const displayReviews = reviews.length > 0 ? reviews : defaultReviews;
  
  const avgRating = displayReviews.reduce((sum, r) => sum + r.rating, 0) / displayReviews.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      setError("Please fill out your name and review.");
      return;
    }

    setLoading(true);
    setError(null);
    
    const res = await addReview(productId, { name, rating, comment });
    if (res.success) {
      setReviews([{ name, rating, comment, date: new Date().toISOString(), verified: false }, ...reviews]);
      setIsWriting(false);
      setName("");
      setComment("");
      setRating(5);
    } else {
      setError(res.error || "Failed to submit review");
    }
    setLoading(false);
  };

  const formatDate = (d: string) => {
    if (d.includes("ago")) return d; // Fallback mock strings
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mt-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Customer Reviews</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? "fill-current" : "text-slate-200"}`} />
              ))}
            </div>
            <span className="font-bold text-slate-900">{avgRating.toFixed(1)}</span>
            <span className="text-slate-500 text-sm">({displayReviews.length} reviews)</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsWriting(!isWriting)} className="gap-2 border-slate-200 text-slate-600 hover:text-slate-900">
          <MessageSquarePlus className="w-4 h-4" /> Write Review
        </Button>
      </div>

      {isWriting && (
        <div className="mb-8 p-4 bg-slate-50 border rounded-lg">
          <h3 className="font-semibold text-slate-900 mb-4">Write a Review</h3>
          {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John D." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                      <Star className={`w-6 h-6 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Review</label>
              <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="What did you like or dislike about this product?" className="h-24" />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsWriting(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700">
                {loading ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </div>
      )}
      
      <div className="space-y-6">
        {displayReviews.map((r, idx) => (
          <div key={idx} className="border-b last:border-0 pb-6 last:pb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">{r.name}</p>
                  {r.verified && <p className="text-[10px] text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified Buyer</p>}
                </div>
              </div>
              <span className="text-xs text-slate-400">{formatDate(r.date)}</span>
            </div>
            <div className="flex text-amber-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-current" : "text-slate-200"}`} />
              ))}
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

