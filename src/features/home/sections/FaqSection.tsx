import React from 'react';
import { ChevronRight } from 'lucide-react';

const faqs = [
  { q: 'What is LoadSaathi and how does it work?', a: 'LoadSaathi is an AI-powered shared freight marketplace connecting shippers and truckers for PTL (Partial Truckload) and LTL (Less Than Truckload) loads across East India. Shippers post their loads, AI matches them with the best available trucks based on route, capacity, price, and reliability — and both sides track the shipment in real time with GPS.' },
  { q: 'How much does it cost to use LoadSaathi?', a: 'LoadSaathi is free to join for both shippers and truckers. We charge a small transaction fee of 2–5% per completed shipment, which varies by role, volume, and credit score. There are no subscriptions, no hidden fees, and no minimum commitments.' },
  { q: 'Which cities and routes does LoadSaathi cover?', a: 'LoadSaathi currently operates across East India with the Rourkela–Ranchi–Burdwan corridor as our primary route. We also cover Bhubaneswar, Kolkata, Jamshedpur, and 50+ cities across Odisha, Jharkhand, and West Bengal with 25+ active freight corridors.' },
  { q: 'How does the credit score system work?', a: 'Every user on LoadSaathi has a digital freight credit score ranging from 300 to 900. The score is based on completion rate, on-time performance, bidirectional reviews, and tenure on the platform. Higher scores unlock better loads and preferential matching for truckers, and attract premium truckers for shippers.' },
  { q: 'Is my payment secure on LoadSaathi?', a: 'Yes. LoadSaathi uses an escrow-backed payment system. Funds are held securely and released in milestones as delivery progresses. Disputes are resolved through our built-in resolution system, and digital settlements mean faster, transparent payouts compared to traditional 30–60 day credit cycles.' },
  { q: 'Who can use LoadSaathi — shippers or truckers?', a: 'Both. Shippers (MSMEs, manufacturers, traders) can post loads and find truck space. Truckers (independent operators, fleet owners) can browse available loads, fill empty capacity, and earn on return trips. The platform is designed to eliminate empty kilometers for truckers and reduce freight costs for shippers.' },
  { q: 'Is LoadSaathi a loan company?', a: 'No. LoadSaathi (loadsaathi.in) is a truck freight and logistics marketplace that connects shippers with truckers for PTL, FTL, and return loads across East India. It is not a loan, lending, or financial services company and has no connection to any "Loan Saathi" finance website.' },
] as const;

const FaqSection = React.memo(() => (
  <section className="fade-section py-24 relative">
    <div className="max-w-[1440px] mx-auto px-6 sm:px-12 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-black mb-4 text-foreground dark:text-white">Frequently Asked Questions</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Answers to the most common questions from shippers and truckers.</p>
      </div>
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((item, i) => (
          <details key={i} className="glass-card rounded-xl border border-border group" open={i === 0}>
            <summary className="p-6 cursor-pointer font-bold text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors list-none flex items-center justify-between">
              {item.q}
              <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform shrink-0 ml-4" />
            </summary>
            <div className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed">{item.a}</div>
          </details>
        ))}
      </div>
    </div>
  </section>
));
FaqSection.displayName = "FaqSection";

export default FaqSection;
