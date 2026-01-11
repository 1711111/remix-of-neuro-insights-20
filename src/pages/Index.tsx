import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/sections/HeroSection";
import ProblemSection from "@/components/sections/ProblemSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import RewardsSection from "@/components/sections/RewardsSection";
import TechnologySection from "@/components/sections/TechnologySection";
import ImpactSection from "@/components/sections/ImpactSection";
import FutureVisionSection from "@/components/sections/FutureVisionSection";
import ChallengesSection from "@/components/sections/ChallengesSection";
import IntroAnimation from "@/components/IntroAnimation";

const Index = () => {
  const [introComplete, setIntroComplete] = useState(false);

  return (
    <>
      <IntroAnimation onComplete={() => setIntroComplete(true)} />
      <div className={`min-h-screen bg-background ${!introComplete ? 'overflow-hidden' : ''}`}>
        <Navbar />
        <main>
          <HeroSection />
          <ProblemSection />
          <HowItWorksSection />
          <ChallengesSection />
          <RewardsSection />
          <TechnologySection />
          <ImpactSection />
          <FutureVisionSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
