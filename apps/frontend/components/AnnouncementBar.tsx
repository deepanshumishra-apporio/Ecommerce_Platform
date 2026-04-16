"use client";

const messages = [
  "✦ USE CODE NEWDROP20 FOR 20% OFF",
  "✦ FREE SHIPPING ON ORDERS ABOVE ₹999",
  "✦ NEW SUMMER COLLECTION 2025 — SHOP NOW",
  "✦ LIMITED EDITION COLLABS — GET YOURS BEFORE THEY DROP",
  "✦ DOWNLOAD THE APP & GET FLAT ₹200 OFF",
  "✦ EASY RETURNS | 7-DAY POLICY",
];

export default function AnnouncementBar() {
  const text = messages.join("          ");

  return (
    <div className="bg-black overflow-hidden py-2.5 select-none">
      <div className="animate-marquee">
        <span className="text-white text-[11px] uppercase tracking-[0.25em] font-medium px-4">
          {text + "          " + text}
        </span>
      </div>
    </div>
  );
}
