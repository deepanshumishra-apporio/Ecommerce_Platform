"use client";

import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { checkCanReview, submitReview, type Review } from "@/lib/api";

export default function ReviewForm({
  productId,
  onSubmitted,
}: {
  productId: string;
  onSubmitted: (review: Review) => void;
}) {
  const { isSignedIn, isLoaded } = useAuth();
  const [status, setStatus]   = useState<"loading" | "can" | "already" | "not_delivered" | "done">("loading");
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setStatus("not_delivered"); return; }
    (async () => {
      try {
        const res = await checkCanReview(productId);
        setStatus(res.canReview ? "can" : res.reason === "already_reviewed" ? "already" : "not_delivered");
      } catch { setStatus("not_delivered"); }
    })();
  }, [isLoaded, isSignedIn, productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a rating"); return; }
    if (!comment.trim()) { setError("Please write a comment"); return; }
    setSubmitting(true); setError(null);
    try {
      const review = await submitReview(productId, rating, comment);
      setStatus("done");
      onSubmitted(review);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit review");
    } finally { setSubmitting(false); }
  }

  if (status === "loading") return (
    <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-widest">
      <div className="w-4 h-4 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
      Checking eligibility…
    </div>
  );

  if (status === "done") return (
    <div className="flex items-center gap-3 bg-[rgba(0,255,148,0.06)] border border-[rgba(0,255,148,0.3)] px-4 py-3">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00FF94" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      <p className="text-sm font-black uppercase tracking-widest text-[#00FF94]">Review submitted — thank you!</p>
    </div>
  );

  if (status === "already") return (
    <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 px-4 py-3">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      <p className="text-xs font-black uppercase tracking-widest text-zinc-400">You've already reviewed this product.</p>
    </div>
  );

  if (status === "not_delivered") return (
    <div className="flex items-start gap-3 bg-zinc-50 border border-zinc-200 px-4 py-3">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" className="mt-0.5 flex-shrink-0"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      <p className="text-xs font-black uppercase tracking-widest text-zinc-400 leading-relaxed">
        {isSignedIn ? "Reviews are only available after your order is delivered." : "Sign in to leave a review after purchasing."}
      </p>
    </div>
  );

  // status === "can"
  return (
    <form onSubmit={handleSubmit} className="border border-zinc-200 p-5 flex flex-col gap-4">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Write a Review</p>

      {/* Star rating */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Your Rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-2xl leading-none transition-transform duration-100 hover:scale-125 active:scale-110"
            >
              <span style={{ color: star <= (hovered || rating) ? "#F59E0B" : "#e5e7eb" }}>★</span>
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Your Comment</p>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product…"
          maxLength={500}
          className="w-full border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors resize-none"
        />
        <p className="text-[9px] text-zinc-300 font-bold mt-1 text-right">{comment.length}/500</p>
      </div>

      {error && <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start bg-black text-white text-xs font-black uppercase tracking-widest px-6 py-3 hover:bg-zinc-800 active:scale-[0.97] transition-all duration-200 disabled:opacity-40 flex items-center gap-2"
      >
        {submitting ? (
          <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
        ) : "Submit Review"}
      </button>
    </form>
  );
}
