import Link from 'next/link';
import { Twitter, Linkedin, Youtube } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="bg-[#0a0a0a] text-white py-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 md:gap-8 mb-16">
          {/* Brand */}
          <div className="col-span-1">
            <div className="text-xl font-bold tracking-tight mb-4">
              Visa<span className="text-[#0066ff]">Eval</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-6 max-w-[200px]">
              AI-powered visa evaluation platform. Ingest, extract, classify, validate and export visa documents with intelligence.
            </p>
            <div className="flex items-center gap-4 text-gray-400">
              <a href="#" className="hover:text-white transition-colors"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-4 h-4" /></a>
              <a href="#" className="hover:text-white transition-colors"><Youtube className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard/api-docs" className="hover:text-white transition-colors">API Docs</Link></li>
              <li><Link href="/#industries" className="hover:text-white transition-colors">Solutions</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold mb-6">Account</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/login" className="hover:text-white transition-colors">Sign in</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Create account</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex justify-between items-center">
          <p className="text-gray-500 text-xs">© 2025 VisaEval. All rights reserved.</p>
          <p className="text-gray-500 text-xs">Built with AI</p>
        </div>
      </div>
    </footer>
  );
}
