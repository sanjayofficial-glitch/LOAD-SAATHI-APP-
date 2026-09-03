
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Check, Truck, Package, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import SeoMeta from "@/components/SeoMeta";

const faqData = [
  {
    category: "For Shippers",
    icon: Package,
    items: [
      {
        q: "How do I post a shipment on LoadSaathi?",
        a: "After registering as a shipper, navigate to your dashboard and click 'Post Shipment'. Enter the origin, destination, cargo type, weight, dimensions, and preferred pickup window. Our AI will immediately start matching your shipment with available trucks on the network. The entire process takes less than 3 minutes.",
      },
      {
        q: "How does AI match my shipment with transporters?",
        a: "Our proprietary matching algorithm evaluates dozens of factors simultaneously: route compatibility, truck availability, capacity matching, pricing history, on-time performance ratings, cargo type specialization, and credit scores. It ranks the best matches and presents them to you with a compatibility score, so you can choose with confidence.",
      },
      {
        q: "Can I track my shipment in real time?",
        a: "Yes. Every shipment on LoadSaathi comes with live GPS tracking. You can see your shipment's location on a map, receive estimated time of arrival updates, and get notified at every milestone — pickup confirmation, in-transit updates, and delivery completion.",
      },
      {
        q: "What types of cargo can I ship?",
        a: "LoadSaathi supports a wide range of cargo types including full truckload (FTL), partial truckload (PTL), oversize cargo, temperature-controlled goods, hazardous materials, and parcel shipments. Each trucker's profile indicates their specialization and certifications.",
      },
      {
        q: "How is pricing determined for my shipment?",
        a: "Our Price Prediction Engine analyzes current market rates, fuel costs, route distance, demand fluctuations, seasonal trends, and historical data to suggest fair market pricing. Shippers can set their own budget, and transporters bid within that range — creating a transparent, competitive marketplace.",
      },
    ],
  },
  {
    category: "For Truckers",
    icon: Truck,
    items: [
      {
        q: "How do I find loads on LoadSaathi?",
        a: "Once registered, you can browse available shipments from your dashboard. Our AI prioritizes loads that match your truck type, capacity, preferred routes, and current location. You can filter by distance, payout, cargo type, and shipper rating. New matches are pushed to you in real-time via notifications.",
      },
      {
        q: "How does the Digital Freight Credit Score work?",
        a: "Every participant on LoadSaathi receives a credit score between 300 and 900. This score is calculated based on trip completion rates, on-time performance, customer reviews, profile completeness, and payment history. Higher scores unlock better loads, lower transaction fees, and faster payment releases.",
      },
      {
        q: "When and how do I get paid?",
        a: "Payments are released through our secure escrow system. Upon delivery confirmation by the shipper, funds are released to your account within 24-48 hours. You can track your earnings, payment history, and pending settlements from your earnings dashboard.",
      },
      {
        q: "Can I choose which loads to accept?",
        a: "Absolutely. You have full control over which loads to bid on or accept. Each shipment listing includes complete details — origin, destination, cargo type, weight, offered price, and shipper information. Accept only the loads that fit your schedule and preferences.",
      },
      {
        q: "What if I need to cancel an accepted load?",
        a: "We understand that circumstances change. If you need to cancel, please do so as early as possible through the platform. Frequent cancellations may impact your credit score. We recommend communicating with the shipper directly through our in-app chat to find a mutually agreeable solution.",
      },
    ],
  },
  {
    category: "Payments",
    icon: Check,
    items: [
      {
        q: "How does the escrow payment system work?",
        a: "When a shipper and trucker agree on a load, the shipper transfers the payment amount to our secure escrow account. The funds are held safely until the shipment is completed and confirmed by both parties. This protects both parties — the shipper knows funds are available, and the trucker knows they'll be paid upon delivery.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept various payment methods including bank transfers, UPI, credit/debit cards, and digital wallets. For enterprise shippers, we also support invoice-based billing with net payment terms.",
      },
      {
        q: "Are there any fees for using the platform?",
        a: "Registration is completely free. We charge a small transaction fee (2-5% of shipment value) only on successfully completed shipments. This fee covers AI matching, payment processing, dispute resolution, and platform operations. There are no hidden charges or subscription fees.",
      },
      {
        q: "How are disputes resolved?",
        a: "In the rare event of a dispute, our dedicated support team reviews all available evidence — including GPS tracking data, timestamped photos, communication history, and delivery confirmations. We aim to resolve disputes within 48 hours and ensure fair outcomes for both parties.",
      },
      {
        q: "Can I get a refund if a shipment isn't completed?",
        a: "If a shipment is cancelled before pickup, the full amount is refunded to the shipper. If issues arise during transit, our dispute resolution process determines the appropriate outcome based on evidence. Our goal is fair treatment for both shippers and truckers.",
      },
    ],
  },
  {
    category: "Trust & Safety",
    icon: Shield,
    items: [
      {
        q: "How do you verify users on the platform?",
        a: "All users undergo multi-level verification including government ID verification (Aadhaar, PAN, DL), business registration documents, vehicle documentation for truckers, and address verification. Verified users receive a trust badge on their profile.",
      },
      {
        q: "What is the bidirectional review system?",
        a: "After every completed shipment, both the shipper and the trucker can rate each other on a 1-5 star scale and leave feedback. This creates accountability on both sides and helps the community make informed decisions. Review scores directly impact credit scores.",
      },
      {
        q: "How do you prevent fraud on the platform?",
        a: "We employ multiple layers of fraud prevention: identity verification, GPS-tracked trips with geofencing, document validation, behavioral analytics, and our escrow payment system. Our AI monitors for suspicious patterns and flags anomalies for review by our trust and safety team.",
      },
      {
        q: "Is my data safe with LoadSaathi?",
        a: "Absolutely. We use industry-standard encryption for all data transmission and storage. We comply with Indian data protection regulations. Your personal information is never shared without your explicit consent. See our Privacy Policy for complete details.",
      },
      {
        q: "What insurance coverage is provided?",
        a: "All shipments on LoadSaathi are eligible for transit insurance coverage. Shippers can opt for additional insurance based on cargo value. Truckers are required to maintain valid insurance for their vehicles. Details are displayed clearly during the matching process.",
      },
      {
        q: "Is LoadSaathi a loan or finance company?",
        a: "No. LoadSaathi (loadsaathi.in) is a truck freight and logistics marketplace that connects shippers with truckers for PTL, FTL, and return loads across East India. It is not a loan, lending, or financial services business, and it has no connection to any 'Loan Saathi' finance website.",
      },
    ],
  },
  {
    category: "Technical",
    icon: Settings,
    items: [
      {
        q: "Is there a mobile app available?",
        a: "LoadSaathi is fully responsive and works seamlessly on all devices through your web browser. Native mobile apps for iOS and Android are in development and will be available soon.",
      },
      {
        q: "Can I integrate LoadSaathi with my existing systems?",
        a: "Yes. We offer REST APIs for enterprise customers who want to integrate LoadSaathi with their existing ERP, TMS, or WMS systems. Contact our enterprise sales team for API documentation and integration support.",
      },
      {
        q: "What languages does the platform support?",
        a: "Currently, LoadSaathi is available in English and Hindi. We are actively working on adding support for additional Indian languages including Marathi, Gujarati, Tamil, Telugu, Kannada, and Bengali.",
      },
      {
        q: "How does the real-time tracking work?",
        a: "Truckers share their live GPS location through our platform while on a trip. Shippers can view the real-time position on an interactive map with route visualization, estimated time of arrival, and geofence alerts when the truck enters predefined zones.",
      },
      {
        q: "What happens if I experience a technical issue?",
        a: "Our support team is available 24/7 to assist with any technical issues. You can reach us through in-app chat, email at support@loadsaathi.com, or through the contact form on our website. Most issues are resolved within 2-4 hours.",
      },
    ],
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.flatMap((cat) =>
    cat.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    }))
  ),
};

const FAQ = () => {
  const accordionRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const refs = [accordionRef.current, ctaRef.current].filter(Boolean);
    refs.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <noscript>
        <div style={{maxWidth:800,margin:'0 auto',padding:'32px',fontFamily:'system-ui'}}>
          <h1>Frequently Asked Questions — LoadSaathi AI Freight Platform</h1>
          <h2>Getting Started</h2>
          <h3>What is LoadSaathi?</h3>
          <p>LoadSaathi is India's AI-powered freight operating system that connects shippers with verified truckers. We use AI matching, real-time tracking, credit scoring, and secure payments to make logistics simple and transparent.</p>
          <h3>Who can use LoadSaathi?</h3>
          <p>Any business shipping goods (manufacturers, traders, exporters, e-commerce) and any trucker looking for loads — solo operators or fleets of any size.</p>
          <h3>How do I sign up?</h3>
          <p>Click Sign Up, select your role (Shipper or Trucker), complete verification, and start posting or browsing immediately. Trucker KYC takes 24-48 hours.</p>
          <h2>AI &amp; Technology</h2>
          <h3>How does the AI matching engine work?</h3>
          <p>It considers route compatibility, vehicle type, pricing history, on-time performance, cargo type, and real-time availability to generate ranked matches with compatibility scores.</p>
          <h3>What is the AI Price Predictor?</h3>
          <p>An analysis tool that provides fair market pricing based on route, weight, vehicle type, current market rates, and demand. It shows recommended, minimum, and maximum rates with confidence levels.</p>
          <h3>What is the Freight Credit Score?</h3>
          <p>A 300-900 scoring system evaluating completion rates, on-time delivery, ratings, communication, and account tenure. Higher scores unlock better loads and lower fees.</p>
          <h2>Pricing &amp; Payments</h2>
          <h3>Are there hidden fees?</h3>
          <p>No. Pricing is transparent. Basic services are free. Pay only for premium features like advanced analytics, ePOD verification, or credit monitoring.</p>
          <h3>How does payment protection work?</h3>
          <p>Payments are held in escrow and released after shipment delivery is confirmed via GPS tracking and ePOD verification. Both parties receive instant notifications.</p>
          <h2>Operations</h2>
          <h3>How do I post a shipment?</h3>
          <p>Log in, click Post Shipment, enter pickup/destination addresses, select vehicle type, enter cargo details, and set your budget or let the AI suggest a price.</p>
          <h3>How do I track shipments?</h3>
          <p>From your dashboard, view the shipment detail page with a live map, vehicle location, ETA, and route. You can also share tracking with customers.</p>
          <h2>Support &amp; Trust</h2>
          <h3>How does LoadSaathi verify truckers?</h3>
          <p>Every trucker undergoes a 4-step verification: KYC (Aadhaar + PAN), vehicle documentation, transport license, and background checks. Verified badges are displayed on profiles.</p>
          <h3>What if there is a dispute?</h3>
          <p>Our AI system flags anomalies and notifies the support team. Both parties provide evidence, and the team mediates within 24-48 hours with fair resolution.</p>
          <h3>How can I contact support?</h3>
          <p>Live chat in-app (24/7), email at support@loadsaathi.in, or call the helpline from your dashboard.</p>
        </div>
      </noscript>
      <SeoMeta
      title="FAQ — Frequently Asked Questions"
      description="Find answers to common questions about LoadSaathi's freight marketplace — how it works, pricing, payments, trust & safety, and technical support for shippers and truckers."
      keywords="LoadSaathi FAQ, freight marketplace questions, how LoadSaathi works, trucking platform help, logistics support India"
      canonical="/faq"
      jsonLd={faqSchema}
      breadcrumbs={[{ name: "FAQ", url: "/faq" }]}
    />
    <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-[400px] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.12] dark:opacity-[0.15]"
            style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.10] dark:opacity-[0.15]"
            style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 w-full relative z-10 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 w-fit mb-6">
              <span className="text-xs font-semibold tracking-widest uppercase bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-700/30">
                Help Center
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              Frequently Asked <span className="text-gradient-orange-blue">Questions</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Everything you need to know about LoadSaathi. Can&apos;t find what you&apos;re looking for? Feel free to contact our support team.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ ACCORDIONS */}
      <section ref={accordionRef} className="fade-section py-24 relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-12 relative z-10 space-y-16">
          {faqData.map((category, idx) => {
            const Icon = category.icon;
            return (
              <div key={idx}>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-lg bg-orange-600/10 dark:bg-orange-500/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h2 className="text-2xl font-black text-foreground dark:text-white">{category.category}</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map((item, i) => (
                    <AccordionItem key={i} value={`${idx}-${i}`}>
                      <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:text-orange-600 dark:hover:text-orange-400 py-5">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="fade-section py-24 relative overflow-hidden bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5">
        <div className="max-w-2xl mx-auto px-6 sm:px-12 relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-foreground dark:text-white mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-8">Our support team is here to help you 24/7.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                Contact Support
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg border-border text-foreground hover:bg-accent">
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default FAQ;
