import Image from 'next/image';

const cards = [
  {
    icon: '/elevate-icon-1.png',
    title: 'Strategy',
    description: 'Build the right immigration strategy with our AI-driven insights — accurate, fast, and effortless to deploy for your firm.',
  },
  {
    icon: '/elevate-icon-2.png',
    title: 'Execution',
    description: 'Discover efficient document evaluation: cost-effective, quick turnaround, and simple API integration for enhanced case management.',
    highlight: true,
  },
  {
    icon: '/elevate-icon-3.png',
    title: 'Data security',
    description: "Your applicants' data is protected with strict adherence to GDPR, SOC 2, and HIPAA for absolute confidentiality.",
  },
];

export default function LandingElevateData() {
  return (
    <div className="bg-[#f0f2f5] py-24 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <h2 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight max-w-md">
              Elevate your visa process with advanced AI technology
            </h2>
          </div>
          <div className="flex items-center">
            <p className="text-gray-600 leading-relaxed max-w-sm text-sm">
              Ready to revolutionize your document workflows? Our AI solutions offer unparalleled accuracy for visa document analysis, streamlining complex tasks like eligibility assessment and compliance checking.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card) => (
            <div key={card.title} className={`${card.highlight ? 'bg-blue-50' : 'bg-white'} rounded-3xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow`}>
              <div className="w-52 h-52 rounded-2xl flex items-center justify-center mb-8">
                <Image
                  src={card.icon}
                  alt={card.title}
                  width={200}
                  height={200}
                  className="w-[200px] h-[200px] object-contain"
                />
              </div>
              <h3 className="text-xl font-semibold mb-4">{card.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
