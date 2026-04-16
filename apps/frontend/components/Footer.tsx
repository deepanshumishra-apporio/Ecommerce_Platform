import Link from "next/link";

const footerColumns = [
  {
    heading: "COOL STUFF",
    links: [
      { label: "New Arrivals", href: "#" },
      { label: "Bestsellers", href: "#" },
      { label: "Collections", href: "#" },
      { label: "Headwear", href: "#" },
      { label: "Clothing", href: "#" },
      { label: "Accessories", href: "#" },
      { label: "Eyewear", href: "#" },
    ],
  },
  {
    heading: "BORING STUFF",
    links: [
      { label: "Track My Order", href: "#" },
      { label: "Returns & Exchanges", href: "#" },
      { label: "Shipping Info", href: "#" },
      { label: "Size Guide", href: "#" },
      { label: "FAQs", href: "#" },
      { label: "Contact Us", href: "#" },
    ],
  },
  {
    heading: "LEGAL",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "Disclaimer", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-2">
            <Link href="/" className="inline-block mb-5">
              <span className="font-black text-2xl tracking-tighter uppercase leading-none">
                DEEP STORE
                <sup className="text-[10px] font-black align-super">®</sup>
              </span>
            </Link>
            <p className="text-zinc-400 text-xs leading-relaxed tracking-wider mb-6 max-w-xs">
              Premium streetwear designed for the bold. Drop the ordinary, wear
              your identity.
            </p>
            {/* Social links */}
            <div className="flex gap-4">
              {[
                { label: "Instagram", icon: <InstagramIcon /> },
                { label: "Twitter / X", icon: <TwitterIcon /> },
                { label: "YouTube", icon: <YoutubeIcon /> },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white transition-colors duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {footerColumns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-[10px] font-black tracking-[0.35em] uppercase text-zinc-500 mb-5">
                {col.heading}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-zinc-400 hover:text-white transition-colors duration-200 tracking-wider"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Store locator strip */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-zinc-700 flex items-center justify-center">
                <LocationIcon />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-500">
                  STORE LOCATOR
                </p>
                <p className="text-xs text-white tracking-wider">
                  Find a store near you — 50+ outlets across India
                </p>
              </div>
            </div>
            <Link
              href="#"
              className="text-[10px] font-black tracking-[0.25em] uppercase border border-zinc-700 px-5 py-2.5 hover:bg-white hover:text-black hover:border-white transition-all duration-200 whitespace-nowrap"
            >
              FIND A STORE
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-zinc-600 text-[10px] tracking-wider uppercase">
            © 2025 DEEP STORE®. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {/* Payment icons placeholder */}
            {["VISA", "MC", "UPI", "GPay"].map((p) => (
              <span
                key={p}
                className="text-[9px] font-black text-zinc-700 border border-zinc-800 px-2 py-1 tracking-wider"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
