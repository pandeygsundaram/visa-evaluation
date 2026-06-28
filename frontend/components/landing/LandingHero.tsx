'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import LandingNav from './LandingNav';

export default function LandingHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <div ref={ref} className="relative bg-gradient-to-br from-[#0066ff] to-[#0047b3] text-white overflow-hidden rounded-b-[2.5rem] min-h-screen flex flex-col">
      {/* Background grid lines — parallax */}
      <motion.div style={{ y }} className="absolute top-0 right-0 bottom-0 left-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <circle cx="80%" cy="50%" r="300" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="85%" cy="40%" r="400" fill="none" stroke="white" strokeWidth="0.5" />
        </svg>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col flex-1">
        <LandingNav />

        <div className="grid md:grid-cols-2 gap-12 items-center flex-1 py-16">
          {/* Left content — slight upward parallax */}
          <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], ['0%', '-8%']) }} className="max-w-xl">
            <h1 className="text-5xl md:text-6xl font-semibold leading-tight tracking-tight mb-6">
              AI-powered visa evaluation in minutes
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed font-light">
              Upload your documents and get instant eligibility analysis across multiple countries. Ingest, extract, classify, validate and receive a detailed report.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="bg-white text-blue-600 px-8 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors shadow-lg text-center"
              >
                Start free evaluation
              </Link>
              <a
                href="#features"
                className="border border-white/40 text-white px-8 py-3 rounded-md font-medium hover:bg-white/10 transition-colors text-center"
              >
                See how it works
              </a>
            </div>
            <p className="text-sm text-blue-200 mt-4">2 free evaluations · No credit card required</p>
          </motion.div>

          {/* Right image — slightly slower parallax for depth */}
          <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], ['0%', '-4%']) }} className="relative">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl overflow-hidden shadow-2xl relative z-10 min-h-[400px]">
              <Image
                src="/hero.jpeg"
                alt="Visa evaluation platform"
                width={600}
                height={400}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
