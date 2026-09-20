"use client";

import { useState } from "react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { HeroSection } from "@/components/marketing/HeroSection";
import { WhiteLabelStudio } from "@/components/marketing/WhiteLabelStudio";
import { TerminalPolicySection } from "@/components/marketing/TerminalPolicySection";
import { DirectorTelegramShowcase } from "@/components/marketing/DirectorTelegramShowcase";
import { MobileEmployeeShowcase } from "@/components/marketing/MobileEmployeeShowcase";
import { LiveMapShowcase } from "@/components/marketing/LiveMapShowcase";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { VideoTutorialsSection } from "@/components/marketing/VideoTutorialsSection";
import { PricingCalculator } from "@/components/marketing/PricingCalculator";
import { RoiCalculatorSection } from "@/components/marketing/RoiCalculatorSection";
import { IndustrySolutionsSection } from "@/components/marketing/IndustrySolutionsSection";
import { TabletKioskShowcase } from "@/components/marketing/TabletKioskShowcase";
import { CaseStudiesSection } from "@/components/marketing/CaseStudiesSection";
import { IntegrationsSection } from "@/components/marketing/IntegrationsSection";
import { CommercialProposalModal } from "@/components/marketing/CommercialProposalModal";
import { SocialProofSection } from "@/components/marketing/SocialProofSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { OnboardingModal } from "@/components/marketing/OnboardingModal";
import { InteractiveDemoTour } from "@/components/marketing/InteractiveDemoTour";
import { VideoTutorialsModal } from "@/components/marketing/VideoTutorialsModal";

export default function MarketingLandingPage() {
  const [isTrialOpen, setIsTrialOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"start" | "biznes" | "korporativ">("biznes");
  const [selectedStaffCount, setSelectedStaffCount] = useState(30);
  const [isAnnual, setIsAnnual] = useState(true);
  const [proposalData, setProposalData] = useState<{
    employees: number;
    salary: number;
    lostMinutes: number;
    monthlyLoss: number;
    savings: number;
  } | null>(null);

  const handleOpenTrialWithPlan = (
    plan: "start" | "biznes" | "korporativ",
    staffCount: number,
    annual: boolean
  ) => {
    setSelectedPlan(plan);
    setSelectedStaffCount(staffCount);
    setIsAnnual(annual);
    setIsTrialOpen(true);
  };

  return (
    <main className="relative">
      {/* Navigation */}
      <MarketingNav
        onOpenDemo={() => setIsDemoOpen(true)}
        onOpenTrial={() => setIsTrialOpen(true)}
        onOpenTutorials={() => setActiveTutorialId("add-employee-faceid")}
      />

      {/* Hero Section */}
      <HeroSection
        onOpenDemo={() => setIsDemoOpen(true)}
        onOpenTrial={() => setIsTrialOpen(true)}
        onOpenTutorials={() => setActiveTutorialId("add-employee-faceid")}
      />

      {/* White-Label Interactive Studio: Try Your Brand & Logo */}
      <WhiteLabelStudio />

      {/* Terminal Policy: 1-2 ta Face ID, To'lov qilinsa o'rnatib sozlashga xizmat haqqi olinmaydi */}
      <TerminalPolicySection
        onOpenTrial={() => setIsTrialOpen(true)}
        onOpenTutorials={() => setActiveTutorialId("terminal-setup")}
      />

      {/* Director Telegram & Biometric Face Recognition Showcase */}
      <DirectorTelegramShowcase
        onOpenTrial={() => setIsTrialOpen(true)}
      />

      {/* Mobile Employee Showcase (GPS Check-in, Davomatim, Grafigim, Ta'tillar) */}
      <MobileEmployeeShowcase
        onOpenTrial={() => setIsTrialOpen(true)}
      />

      {/* Live Map & Geofence Showcase: Check-in connects, Check-out disconnects */}
      <LiveMapShowcase
        onOpenTrial={() => setIsTrialOpen(true)}
      />

      {/* Video Tutorials Section */}
      <VideoTutorialsSection
        onOpenLesson={(lessonId) => setActiveTutorialId(lessonId)}
      />

      {/* Industry-specific solutions (Clinics, Factories, Offices, Retail) */}
      <IndustrySolutionsSection
        onOpenTrial={() => setIsTrialOpen(true)}
      />

      {/* 0 so'mlik Kiosk Face ID (Planshet rejimi) */}
      <TabletKioskShowcase
        onOpenTrial={() => setIsTrialOpen(true)}
      />

      {/* Features Grid & Universal Hardware Spotlight */}
      <FeatureGrid />

      {/* O'zbekiston Real Keyslari (Case Studies) */}
      <CaseStudiesSection
        onOpenTrial={() => setIsTrialOpen(true)}
      />

      {/* ROI & Tardiness Savings Calculator */}
      <RoiCalculatorSection
        onOpenTrial={() => setIsTrialOpen(true)}
        onOpenProposal={(data) => setProposalData(data)}
      />

      {/* Pricing Calculator based on employee count */}
      <PricingCalculator
        onSelectPlan={handleOpenTrialWithPlan}
        onOpenProposal={(data) => setProposalData(data)}
      />

      {/* 1C, Didox & National Integrations Section */}
      <IntegrationsSection
        onOpenTrial={() => setIsTrialOpen(true)}
      />

      {/* Social Proof & Statistics */}
      <SocialProofSection />

      {/* FAQ Accordion */}
      <FaqSection onOpenTrial={() => setIsTrialOpen(true)} />

      {/* Footer */}
      <MarketingFooter />

      {/* Interactive Video Tutorials Modal */}
      <VideoTutorialsModal
        isOpen={!!activeTutorialId}
        onClose={() => setActiveTutorialId(null)}
        defaultLessonId={activeTutorialId || undefined}
      />

      {/* Interactive Sandbox Product Tour Modal */}
      <InteractiveDemoTour
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onStartTrial={() => {
          setIsDemoOpen(false);
          setIsTrialOpen(true);
        }}
      />

      {/* 14 Day Free Trial & Self-Serve Checkout Onboarding Modal */}
      <OnboardingModal
        isOpen={isTrialOpen}
        onClose={() => setIsTrialOpen(false)}
        defaultPlan={selectedPlan}
        defaultStaffCount={selectedStaffCount}
        isAnnual={isAnnual}
      />

      {/* Commercial Proposal PDF / Print Modal for Executives */}
      <CommercialProposalModal
        isOpen={!!proposalData}
        onClose={() => setProposalData(null)}
        initialData={proposalData || undefined}
      />
    </main>
  );
}
