import LandingHero from '@/components/landing/LandingHero';
import LandingTrustedBy from '@/components/landing/LandingTrustedBy';
import LandingDiscoverSmarter from '@/components/landing/LandingDiscoverSmarter';
import LandingElevateData from '@/components/landing/LandingElevateData';
import LandingHowIndustriesUse from '@/components/landing/LandingHowIndustriesUse';
import LandingDataSecurity from '@/components/landing/LandingDataSecurity';
import LandingNewsletter from '@/components/landing/LandingNewsletter';
import LandingFooter from '@/components/landing/LandingFooter';

export default function Home() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white font-sans text-gray-900 selection:bg-blue-100">
      <LandingHero />
      <LandingTrustedBy />
      <LandingDiscoverSmarter />
      <LandingElevateData />
      <LandingHowIndustriesUse />
      <LandingDataSecurity />
      <LandingNewsletter />
      <LandingFooter />
    </div>
  );
}
