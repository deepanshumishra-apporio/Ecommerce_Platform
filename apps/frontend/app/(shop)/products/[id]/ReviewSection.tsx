"use client";

import { useState } from "react";
import ReviewForm from "@/components/ReviewForm";
import type { Review } from "@/lib/api";

const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function ReviewSection({
  productId,
  initialReviews,
}: {
  productId: string;
  initialReviews: Review[];
}) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <section className="mt-16 border-t border-zinc-100 pt-10">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-1">Customer Reviews</p>
          <h2 className="text-xl font-black uppercase tracking-tight">
            {reviews.length > 0 ? `${reviews.length} Review${reviews.length !== 1 ? "s" : ""}` : "No Reviews Yet"}
          </h2>
        </div>

        {avg && (
          <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-100 px-4 py-3">
            <span className="text-3xl font-black">{avg.toFixed(1)}</span>
            <div>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} style={{ color: s <= Math.round(avg) ? "#F59E0B" : "#e5e7eb" }} className="text-lg">★</span>
                ))}
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">out of 5</p>
            </div>
          </div>
        )}
      </div>

      {/* Rating bars */}
      {reviews.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-8 max-w-xs">
          {counts.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2 text-[10px] font-black">
              <span className="text-zinc-500 w-4 text-right">{star}</span>
              <span className="text-amber-400">★</span>
              <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }}
                />
              </div>
              <span className="text-zinc-400 w-4">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Review cards */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {reviews.map((r) => (
            <div key={r.id} className="border border-zinc-100 p-4 hover:border-zinc-300 hover:shadow-sm transition-all duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-black text-white flex items-center justify-center text-[10px] font-black uppercase rounded-full">
                    {((r as { user?: { email?: string } }).user?.email?.[0] ?? "U").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700">
                      {(r as { user?: { email?: string } }).user?.email?.split("@")[0] ?? "User"}
                    </p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">{LABELS[r.rating]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} style={{ color: s <= r.rating ? "#F59E0B" : "#e5e7eb" }} className="text-sm">★</span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      {/* Write review */}
      <div className="border-t border-zinc-100 pt-8">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-4">Leave a Review</p>
        <ReviewForm
          productId={productId}
          onSubmitted={(review) => setReviews((prev) => [review, ...prev])}
        />
      </div>
    </section>
  );
}
