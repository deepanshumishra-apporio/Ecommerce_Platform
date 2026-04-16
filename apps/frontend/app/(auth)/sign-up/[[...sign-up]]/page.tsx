import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">

      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,255,148,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />

        <Link href="/" className="relative z-10">
          <span className="font-black text-2xl tracking-tighter text-white uppercase">DEEP STORE<sup className="text-[11px]">®</sup></span>
        </Link>

        <div className="relative z-10">
          <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-4">Join The Tribe</p>
          <h2 className="text-5xl font-black uppercase tracking-tight text-white leading-none mb-6">CREATE<br />YOUR<br />ACCOUNT</h2>
          <div className="flex flex-col gap-2">
            {["Early access to new drops", "Exclusive member deals", "Free shipping on ₹999+"].map((perk) => (
              <div key={perk} className="flex items-center gap-2">
                <span className="text-[#00FF94] text-xs font-black">✓</span>
                <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{perk}</span>
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
              <p className="text-[10px] font-black tracking-[0.45em] uppercase text-[#00FF94] mb-2">Join The Tribe</p>
              <h1 className="text-3xl font-black uppercase tracking-tight">Create Account</h1>
            </div>

            <SignUp
              appearance={{
                variables: {
                  colorPrimary: "#000000",
                  colorBackground: "#ffffff",
                  colorText: "#000000",
                  colorTextSecondary: "#666666",
                  colorInputBackground: "#fafafa",
                  colorInputText: "#000000",
                  borderRadius: "0px",
                  colorDanger: "#FF3131",
                  fontFamily: "inherit",
                },
                elements: {
                  rootBox: "w-full",
                  card: "bg-white border border-zinc-200 shadow-none rounded-none w-full p-8",
                  headerTitle: "hidden", headerSubtitle: "hidden", header: "hidden",
                  socialButtonsBlockButton: "border border-zinc-200 bg-white text-black hover:bg-zinc-50 rounded-none text-[11px] font-bold tracking-widest uppercase transition-colors",
                  socialButtonsBlockButtonText: "text-[11px] font-bold tracking-wider uppercase",
                  dividerLine: "bg-zinc-200",
                  dividerText: "text-zinc-400 text-[10px] tracking-widest uppercase",
                  formFieldLabel: "text-[10px] font-black tracking-[0.25em] uppercase text-zinc-400",
                  formFieldInput: "bg-zinc-50 border-zinc-200 text-black rounded-none text-sm focus:border-black focus:ring-0 transition-colors",
                  formButtonPrimary: "bg-black text-white rounded-none text-[11px] font-black tracking-[0.3em] uppercase hover:bg-zinc-800 transition-colors h-12",
                  footerAction: "text-center",
                  footerActionText: "text-zinc-400 text-xs",
                  footerActionLink: "text-black font-black text-xs hover:text-zinc-600 transition-colors underline",
                  identityPreviewText: "text-black",
                  identityPreviewEditButton: "text-black",
                  formFieldInputShowPasswordButton: "text-zinc-400 hover:text-black",
                  otpCodeFieldInput: "bg-zinc-50 border-zinc-200 text-black rounded-none",
                  alertText: "text-xs",
                  formResendCodeLink: "text-black text-xs",
                },
              }}
            />

            <p className="text-center text-zinc-400 text-xs font-bold uppercase tracking-widest mt-6">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-black font-black hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
