import { useEffect } from 'react';
import SeoMeta from '@/components/SeoMeta';
import HeroSection from '@/features/home/sections/HeroSection';
import SectionNav from '@/features/home/sections/SectionNav';
import ProofBar from '@/features/home/sections/ProofBar';
import BentoGrid from '@/features/home/sections/BentoGrid';
import WhatIsLoadSaathi from '@/features/home/sections/WhatIsLoadSaathi';
import HowItWorksSection from '@/features/home/sections/HowItWorksSection';
import WhyLoadSaathi from '@/features/home/sections/WhyLoadSaathi';
import PlatformTabs from '@/features/home/sections/PlatformTabs';
import TrustedAcrossEastIndia from '@/features/home/sections/TrustedAcrossEastIndia';
import VisionSection from '@/features/home/sections/VisionSection';
import AppPreview from '@/features/home/sections/AppPreview';
import SafetyTrust from '@/features/home/sections/SafetyTrust';
import FaqSection from '@/features/home/sections/FaqSection';
import CtaSection from '@/features/home/sections/CtaSection';

const Index = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-section').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <SeoMeta
        title="Shared Freight Marketplace | PTL/LTL East India"
        description="LoadSaathi connects shippers and truckers for PTL and LTL shared freight across East India. Save up to 40% on freight costs on the Rourkela–Ranchi–Burdwan corridor. Book part loads online."
        canonical="/"
        keywords="PTL freight Rourkela, LTL transport East India, shared truck Ranchi Burdwan, part load Jharkhand Odisha, freight marketplace India, truck booking Rourkela"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is LoadSaathi and how does it work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "LoadSaathi is an AI-powered shared freight marketplace connecting shippers and truckers for PTL and LTL loads across East India. Shippers post their loads, AI matches them with the best available trucks based on route, capacity, price, and reliability — and both sides track the shipment in real time with GPS."
              }
            },
            {
              "@type": "Question",
              "name": "How much does it cost to use LoadSaathi?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "LoadSaathi is free to join for both shippers and truckers. We charge a small transaction fee of 2–5% per completed shipment, which varies by role, volume, and credit score. There are no subscriptions, no hidden fees, and no minimum commitments."
              }
            },
            {
              "@type": "Question",
              "name": "Which cities and routes does LoadSaathi cover?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "LoadSaathi currently operates across East India with the Rourkela–Ranchi–Burdwan corridor as our primary route. We also cover Bhubaneswar, Kolkata, Jamshedpur, and 50+ cities across Odisha, Jharkhand, and West Bengal with 25+ active freight corridors."
              }
            },
            {
              "@type": "Question",
              "name": "How does the credit score system work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Every user on LoadSaathi has a digital freight credit score ranging from 300 to 900. The score is based on completion rate, on-time performance, bidirectional reviews, and tenure on the platform. Higher scores unlock better loads and preferential matching."
              }
            },
            {
              "@type": "Question",
              "name": "Is my payment secure on LoadSaathi?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. LoadSaathi uses an escrow-backed payment system. Funds are held securely and released in milestones as delivery progresses. Digital settlements mean faster, transparent payouts compared to traditional 30–60 day credit cycles."
              }
            },
            {
              "@type": "Question",
              "name": "Who can use LoadSaathi — shippers or truckers?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Both. Shippers (MSMEs, manufacturers, traders) can post loads and find truck space. Truckers (independent operators, fleet owners) can browse available loads, fill empty capacity, and earn on return trips."
              }
            },
            {
              "@type": "Question",
              "name": "Is LoadSaathi a loan company?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. LoadSaathi (loadsaathi.in) is a truck freight and logistics marketplace that connects shippers with truckers for PTL, FTL, and return loads. It is not a loan, lending, or financial services company and has no connection to any 'Loan Saathi' finance website."
              }
            }
          ]
        }}
      />
      <HeroSection />
      <SectionNav />
      <div id="problems"><ProofBar /><BentoGrid /></div>
      <div id="what-is"><WhatIsLoadSaathi /></div>
      <div id="how-it-works"><HowItWorksSection /><WhyLoadSaathi /></div>
      <div id="platform"><PlatformTabs /></div>
      <div id="locations"><TrustedAcrossEastIndia /></div>
      <VisionSection />
      <AppPreview />
      <SafetyTrust />
      <div id="faq"><FaqSection /></div>
      <CtaSection />
    </>
  );
};

export default Index;
