"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { signin } from "../../../../lib/api";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);

  const registered = searchParams.get("registered") === "1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signin(email, password);
      signIn(res.token, res.user);
      router.push(res.user.role === "ADMIN" ? "/admin/dashboard" : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {visible
        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      }
    </svg>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">

      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,255,148,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />

        <Link href="/" className="relative z-10">
          <span className="font-black text-2xl tracking-tighter text-white uppercase">DEEP STORE<sup className="text-[11px]">®</sup></span>
        </Link>

        <div className="relative z-10">
          <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-4">Welcome Back</p>
          <h2 className="text-5xl font-black uppercase tracking-tight text-white leading-none mb-6">SIGN IN<br />TO YOUR<br />ACCOUNT</h2>
          <div className="flex flex-col gap-3">
            {[
              "Access your orders & tracking",
              "Manage your wishlist",
              "Saved addresses & preferences",
              "Exclusive member pricing",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-[#00FF94] text-xs font-black">→</span>
                <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-zinc-700 text-xs font-bold uppercase tracking-widest relative z-10">© 2025 Deep Store</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden border-b border-zinc-100 py-4 px-6">
          <Link href="/"><span className="font-black text-xl tracking-tighter uppercase">DEEP STORE<sup className="text-[10px]">®</sup></span></Link>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            <div className="text-center mb-8 lg:hidden">
              <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-2">Welcome Back</p>
              <h1 className="text-3xl font-black uppercase tracking-tight">Sign In</h1>
            </div>

            <div className="hidden lg:block mb-8">
              <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-2">Welcome Back</p>
              <h1 className="text-3xl font-black uppercase tracking-tight">Sign In</h1>
              <p className="text-zinc-400 text-sm mt-2">Good to see you again. Let&apos;s get you in.</p>
            </div>

            {registered && (
              <div className="mb-5 border-l-4 border-[#00FF94] bg-green-50 px-4 py-3 flex items-center gap-2">
                <span className="text-[#00FF94] font-black text-sm">✓</span>
                <p className="text-green-700 text-xs font-bold">Account created! Sign in to continue.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 w-full p-8 flex flex-col gap-5">

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-400">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="bg-zinc-50 border border-zinc-200 text-black text-sm px-3 py-2.5 outline-none focus:border-black transition-colors placeholder:text-zinc-300"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-400">Password</label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full bg-zinc-50 border border-zinc-200 text-black text-sm px-3 py-2.5 pr-10 outline-none focus:border-black transition-colors placeholder:text-zinc-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                    tabIndex={-1}
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="border-l-4 border-[#FF3131] bg-red-50 px-3 py-2">
                  <p className="text-[#FF3131] text-xs font-bold">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white text-[11px] font-black tracking-[0.3em] uppercase h-12 hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "Signing In…" : "Sign In"}
              </button>
            </form>

            <p className="text-center text-zinc-400 text-xs font-bold uppercase tracking-widest mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-black font-black hover:underline">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
