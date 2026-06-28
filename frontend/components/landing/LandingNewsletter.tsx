'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function LandingNewsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="bg-[#0066ff] text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-5 gap-8 items-stretch">

        {/* Left — 2 cols */}
        <div className="col-span-2 relative py-24">
          <h2 className="text-5xl md:text-6xl font-semibold leading-tight tracking-tight mb-4">
            <span className="text-blue-200/70">Join our</span><br />community.
          </h2>

          <div className="relative flex items-center mb-6">
            <p className="text-blue-100 text-lg">
              Subscribe to our weekly newsletter.
            </p>
            <div className="absolute hidden md:block" style={{ right: '88px', top: '0px' }}>
              <Image src="/curved-arrow.png" alt="" width={70} height={70} className="opacity-80" />
            </div>
          </div>

          {submitted ? (
            <p className="text-white font-semibold text-xl mt-6">Thanks! You're on the list. 🎉</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xs mt-8">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="bg-transparent border-b border-blue-300 pb-3 px-0 text-white placeholder-blue-300 focus:outline-none focus:border-white transition-colors w-full text-base"
              />
              <button
                type="submit"
                className="bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors self-start mt-1"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>

        {/* Right — 3 cols, full height */}
        <div className="col-span-3 relative min-h-[520px]">
          <Image
            src="/newsletter-illustration.png"
            alt="Document management illustration"
            fill
            className="object-contain object-center"
          />
        </div>

      </div>
    </div>
  );
}
