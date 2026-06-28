'use client';

import Image from 'next/image';

const logos = [
  { src: '/logos/logoipsum-425.png', alt: 'Logoipsum' },
  { src: '/logos/Globo 2024.png', alt: 'Globo' },
  { src: '/logos/logoipsum-354.png', alt: 'Logoipsum' },
  { src: '/logos/Pitch Presentation.png', alt: 'Pitch' },
  { src: '/logos/logoipsum-290.png', alt: 'Logoipsum' },
  { src: '/logos/logoipsum-416.png', alt: 'Logoipsum' },
  { src: '/logos/logoipsum-431.png', alt: 'Logoipsum' },
];

// 4 copies so the strip is always full — animate by -25% = exactly one set width
const repeated = [...logos, ...logos, ...logos, ...logos];

export default function LandingTrustedBy() {
  return (
    <div className="bg-white py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-16">
        <p className="text-gray-700 font-semibold text-2xl">Trusted by across the global businesses</p>
      </div>

      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div
          className="flex items-center gap-16 px-8 w-max"
          style={{ animation: 'marquee 35s linear infinite' }}
        >
          {repeated.map((logo, i) => (
            <div
              key={i}
              className="flex items-center justify-center shrink-0 opacity-90 hover:opacity-100 transition-all duration-300"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={180}
                height={60}
                className="h-12 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
      `}</style>
    </div>
  );
}
