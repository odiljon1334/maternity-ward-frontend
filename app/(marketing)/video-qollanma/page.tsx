"use client";

import { useState } from "react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { VideoTutorialsSection } from "@/components/marketing/VideoTutorialsSection";
import { VideoTutorialsModal } from "@/components/marketing/VideoTutorialsModal";
import { OnboardingModal } from "@/components/marketing/OnboardingModal";
import { InteractiveDemoTour } from "@/components/marketing/InteractiveDemoTour";
import {
  Video,
  Play,
} from "lucide-react";

export default function VideoQollanmaPage() {
  const [isTrialOpen, setIsTrialOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      <MarketingNav
        onOpenDemo={() => setIsDemoOpen(true)}
        onOpenTrial={() => setIsTrialOpen(true)}
      />

      {/* Hero Header */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20 overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800">
            <Video className="w-4 h-4" />
            <span>StaffPulse Video Akademiya</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            Dasturdan Foydalanish Bo&apos;yicha{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
              Video Qo&apos;llanmalar
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            StaffPulse tizimidan to&apos;liq va samarali foydalanishni 5 ta qulay darslik orqali o&apos;rganing. Xodim qo&apos;shish, Face ID rasm yuklash, har bir kunga alohida smena grafiklari, oylik maosh va Excel/PDF eksport bo&apos;yicha bosqichma-bosqich yo&apos;riqnoma.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTutorialId("add-employee-faceid")}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>1-Darsni tomosha qilish</span>
            </button>
            <button
              onClick={() => setIsTrialOpen(true)}
              className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>14 kunlik bepul sinov</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Video Lessons Section */}
      <VideoTutorialsSection
        onOpenLesson={(id) => setActiveTutorialId(id)}
      />

      {/* Footer */}
      <MarketingFooter />

      {/* Video Modal Player */}
      <VideoTutorialsModal
        isOpen={!!activeTutorialId}
        onClose={() => setActiveTutorialId(null)}
        defaultLessonId={activeTutorialId || undefined}
      />

      {/* Onboarding Trial Modal */}
      <OnboardingModal
        isOpen={isTrialOpen}
        onClose={() => setIsTrialOpen(false)}
        defaultPlan="biznes"
        defaultStaffCount={30}
        isAnnual={true}
      />

      {/* Demo Tour Modal */}
      <InteractiveDemoTour
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onStartTrial={() => {
          setIsDemoOpen(false);
          setIsTrialOpen(true);
        }}
      />
    </main>
  );
}
