'use client';

import { useState } from 'react';
import Link from 'next/link';

const tabs = [
  {
    label: 'Immigration Law Firms',
    content: 'Automate document review and eligibility checks for multiple visa categories. Cut case processing time by 80% while maintaining precision that clients and courts expect.',
  },
  {
    label: 'Corporate HR & Mobility',
    content: 'Streamline work visa applications for international hires. Our platform flags missing documents and validates requirements before submission, reducing rejection rates significantly.',
  },
  {
    label: 'Recruitment Agencies',
    content: 'Pre-screen international candidates by evaluating their visa eligibility before placement. Save time and set accurate expectations with automated eligibility scoring.',
  },
  {
    label: 'Education Institutions',
    content: 'Verify student visa documents, transcripts, and sponsorship letters instantly. Handle large cohorts of international applications without adding headcount.',
  },
  {
    label: 'Financial Services',
    content: 'Validate identity documents, income proofs, and employment records for visa-backed financial products in seconds. Full audit trail for compliance purposes.',
  },
];

export default function LandingHowIndustriesUse() {
  const [activeTab, setActiveTab] = useState(tabs[0].label);
  const active = tabs.find((t) => t.label === activeTab)!;

  return (
    <div id="industries" className="bg-white py-24 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-semibold text-center mb-20">
          How industries use<br />VisaEval AI
        </h2>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left — Tabs */}
          <div>
            <div className="flex flex-col space-y-2">
              {tabs.map((tab) => (
                <div key={tab.label} className="border-b border-gray-100 last:border-0 pb-4 mb-4">
                  <button
                    onClick={() => setActiveTab(tab.label)}
                    className={`text-xl md:text-2xl font-medium w-full text-left transition-colors ${
                      activeTab === tab.label ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                  {activeTab === tab.label && (
                    <div className="mt-4 text-gray-500 text-sm leading-relaxed pr-12">
                      {active.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Link
              href="/signup"
              className="inline-block mt-8 bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
            >
              Get started for free
            </Link>
          </div>

          {/* Right — Illustration */}
          <div className="bg-gray-50 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden min-h-[400px] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />

            <div className="relative z-10 w-full max-w-sm flex flex-col gap-6">
              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between ml-12">
                <div className="bg-green-50 text-green-600 text-xs font-medium px-3 py-1 rounded-full">
                  Passport Verified
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md flex items-center justify-between -ml-4 z-20">
                <div className="font-bold text-[#0066ff] text-lg tracking-tight">VisaEval</div>
                <div className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full">
                  Eligible ✓
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between ml-8 relative z-10">
                <div className="bg-orange-50 text-orange-600 text-xs font-medium px-3 py-1 rounded-full">
                  Income Proof
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
