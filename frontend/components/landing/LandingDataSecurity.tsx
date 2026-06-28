import Link from 'next/link';
import Image from 'next/image';

export default function LandingDataSecurity() {
  return (
    <div id="security" className="bg-white py-32 pb-40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left */}
          <div>
            <h2 className="text-5xl md:text-6xl font-semibold leading-tight tracking-tight mb-8">
              Data security is our first priority
            </h2>
            <p className="text-gray-600 leading-relaxed text-base md:text-lg mb-12 max-w-md">
              Your clients' sensitive documents are encrypted in transit and at rest. We operate with strict data handling controls — your applicant data is never used to train AI models, and access is fully audited.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-black text-white px-10 py-4 rounded-md font-medium hover:bg-gray-800 transition-colors"
            >
              Start secure evaluation
            </Link>
          </div>

          {/* Right — 3D cloud security illustration */}
          <div className="flex justify-center items-center -mr-16">
            <Image
              src="/spacesec.png"
              alt="Secure cloud storage"
              width={800}
              height={800}
              className="w-full max-w-[780px] object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
