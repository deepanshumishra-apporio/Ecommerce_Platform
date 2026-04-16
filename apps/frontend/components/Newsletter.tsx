"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="bg-black py-14 sm:py-16 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#0EA5E9] mb-4">
          STAY IN THE LOOP
        </p>
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-3">
          JOIN THE TRIBE
        </h2>
        <p className="text-zinc-400 text-xs tracking-[0.2em] uppercase mb-8 font-medium">
          GET EARLY ACCESS TO DROPS, EXCLUSIVE DEALS & STREETWEAR INSPO
        </p>

        {submitted ? (
          <div className="inline-flex items-center gap-3 bg-[#00FF94] text-black text-[11px] font-black tracking-[0.25em] uppercase px-8 py-4">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            YOU&apos;RE IN THE TRIBE!
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="YOUR EMAIL ADDRESS"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-zinc-900 border border-zinc-700 px-4 py-3.5 text-white text-[11px] tracking-widest uppercase placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black text-[11px] font-black tracking-[0.25em] uppercase px-7 py-3.5 hover:from-cyan-400 hover:to-teal-400 transition-all duration-200 whitespace-nowrap"
            >
              SUBSCRIBE
            </button>
          </form>
        )}

        <p className="text-zinc-600 text-[10px] mt-4 tracking-wider uppercase">
          NO SPAM. UNSUBSCRIBE ANYTIME.
        </p>
      </div>
    </section>
  );
}
