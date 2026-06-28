import Image from 'next/image';
import { Upload, FileSearch, CheckCircle, Share2 } from 'lucide-react';

export default function LandingDiscoverSmarter() {
  return (
    <div id="features" className="bg-white py-20 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-semibold text-center mb-20">
          Discover smarter<br />visa document management
        </h2>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Left Card */}
          <div className="bg-gray-50 rounded-3xl overflow-hidden flex flex-col">
            <div className="relative h-[380px] mx-6 mt-6 rounded-2xl overflow-hidden">
              <Image
                src="/discover-integrations.png"
                alt="App integrations"
                fill
                className="object-cover"
                style={{ objectPosition: 'calc(50% - 10px) center' }}
              />
            </div>
            <div className="p-8">
              <h3 className="text-3xl font-semibold mb-3">Manage all your visa documents for meaningful intelligence</h3>
              <p className="text-gray-500 text-base leading-relaxed">
                Unlock the potential of your unstructured visa documents — passports, financial statements, employment letters. Streamline decision-making with our intelligent extraction tools.
              </p>
            </div>
          </div>

          {/* Right Card */}
          <div className="bg-[#fff9f6] rounded-3xl overflow-hidden flex flex-col">
            <div className="p-8 flex flex-col gap-4 flex-1">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-100/50 rounded-full blur-3xl" />
              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Upload documents</span>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                  <FileSearch className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">AI extraction & analysis</span>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Eligibility scoring</span>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Export detailed report</span>
              </div>
            </div>
            <div className="px-8 pb-8">
              <h3 className="text-3xl font-semibold mb-3">Simplify your immigration workflow with Intelligent Automation</h3>
              <p className="text-gray-500 text-base leading-relaxed">
                Streamline your practice with AI that extracts, classifies, and evaluates visa documents in seconds — not days. Elevate productivity with smart, automated solutions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
