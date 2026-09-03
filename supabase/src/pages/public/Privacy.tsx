
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeoMeta from "@/components/SeoMeta";

const sections = [
  {
    title: "Information We Collect",
    content: [
      {
        heading: "Personal Information",
        text: "When you register for LoadSaathi, we collect information that identifies you as an individual. This includes your full name, email address, phone number, physical address, government-issued identification numbers (such as Aadhaar, PAN, or Driver's License), and business registration details.",
      },
      {
        heading: "Transaction Information",
        text: "We collect details about every transaction on our platform including shipment origins and destinations, cargo descriptions, pricing information, payment records, GPS tracking data, and communication logs between users.",
      },
      {
        heading: "Device & Usage Information",
        text: "We automatically collect information about how you interact with our platform including your IP address, browser type, operating system, device identifiers, pages visited, time spent, and referral URLs.",
      },
    ],
  },
  {
    title: "How We Use Your Information",
    content: [
      {
        heading: "Providing Platform Services",
        text: "We use your information to facilitate matches between shippers and transporters, process payments, enable real-time tracking, and provide customer support.",
      },
      {
        heading: "Trust & Safety",
        text: "Your data powers our Digital Freight Credit Score system, enables identity verification, detects fraudulent activity, and maintains the integrity of our bidirectional review system.",
      },
      {
        heading: "Improving Our Platform",
        text: "We analyze usage patterns to improve our AI matching algorithms, enhance user experience, develop new features, and optimize platform performance.",
      },
      {
        heading: "Communications",
        text: "We send transactional notifications about your shipments, payments, and account activity. With your consent, we may also send marketing communications about platform updates and new features.",
      },
    ],
  },
  {
    title: "Information Sharing",
    content: [
      {
        heading: "With Other Users",
        text: "When you engage in a transaction, certain information is shared with the counterparty — such as your name, contact details, and credit score. This is necessary to facilitate logistics operations.",
      },
      {
        heading: "Service Providers",
        text: "We engage trusted third-party service providers for payment processing, identity verification, cloud hosting, and analytics. These providers are contractually bound to protect your data.",
      },
      {
        heading: "Legal Compliance",
        text: "We may disclose your information when required by law, court order, or governmental regulation. We will notify you of such requests when legally permitted.",
      },
      {
        heading: "No Data Selling",
        text: "We do not sell your personal information to third parties. Your data is used exclusively to provide and improve LoadSaathi services.",
      },
    ],
  },
  {
    title: "Data Security",
    content: [
      {
        heading: "Encryption",
        text: "All data transmitted through LoadSaathi is encrypted using industry-standard TLS 1.3 protocols. Data at rest is encrypted using AES-256 encryption.",
      },
      {
        heading: "Access Controls",
        text: "We implement strict access controls and authentication mechanisms to ensure that only authorized personnel can access user data. All access is logged and audited.",
      },
      {
        heading: "Data Retention",
        text: "We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your data by contacting our support team.",
      },
    ],
  },
  {
    title: "Your Rights",
    content: [
      {
        heading: "Access & Portability",
        text: "You have the right to request a copy of the personal data we hold about you and to receive it in a structured, commonly used format.",
      },
      {
        heading: "Correction & Deletion",
        text: "You may update or correct your information through your account settings. You can also request deletion of your account and associated data, subject to legal retention requirements.",
      },
      {
        heading: "Withdraw Consent",
        text: "Where we rely on your consent to process your data, you have the right to withdraw that consent at any time. This does not affect the lawfulness of processing based on consent before its withdrawal.",
      },
    ],
  },
  {
    title: "Contact Us",
    content: [
      {
        heading: "Data Protection Questions",
        text: "If you have any questions about this Privacy Policy or our data practices, please contact our Data Protection Officer at privacy@loadsaathi.com.",
      },
      {
        heading: "Address",
        text: "LoadSaathi Technologies Pvt. Ltd., Bengaluru, Karnataka, India. We will respond to all legitimate requests within 30 days.",
      },
    ],
  },
];

const Privacy = () => {
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
    document.querySelectorAll(".fade-section").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const lastUpdated = "January 1, 2026";

  return (
    <>
    <SeoMeta
      title="Privacy Policy"
      description="LoadSaathi's privacy policy — how we collect, use, and protect your personal data. We are committed to safeguarding your privacy on our freight marketplace."
      keywords="LoadSaathi privacy, freight platform privacy policy, data protection India"
      canonical="/privacy"
      breadcrumbs={[{ name: "Privacy Policy", url: "/privacy" }]}
    />
    <div className="min-h-screen bg-background dark:bg-[#050816] text-foreground antialiased overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-[350px] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.12] dark:opacity-[0.15]"
            style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="max-w-4xl mx-auto px-6 sm:px-12 w-full relative z-10 py-20">
          <div className="inline-flex items-center gap-2 w-fit mb-6">
            <span className="text-xs font-semibold tracking-widest uppercase bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-700/30">
              Legal
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-4">
            Privacy <span className="text-gradient-orange-blue">Policy</span>
          </h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="fade-section py-16 relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-12 relative z-10">
          <div className="glass-card p-8 sm:p-10 rounded-xl border-border dark:border-white/[0.08] mb-10">
            <p className="text-muted-foreground leading-relaxed">
              At LoadSaathi, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully. By using LoadSaathi, you consent to the data practices described in this policy.
            </p>
          </div>

          <div className="space-y-12">
            {sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground dark:text-white mb-6 pb-4 border-b border-border">
                  {section.title}
                </h2>
                <div className="space-y-6">
                  {section.content.map((item, j) => (
                    <div key={j}>
                      <h3 className="text-lg font-bold text-foreground mb-2">{item.heading}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="fade-section py-16 relative overflow-hidden bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5">
        <div className="max-w-xl w-full mx-auto px-6 sm:px-12 relative z-10 text-center">
          <Shield className="h-10 w-10 text-orange-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-foreground dark:text-white mb-4">Questions About Privacy?</h2>
          <p className="text-muted-foreground mb-8">Our Data Protection Officer is here to help.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                Contact Us
              </Button>
            </Link>
            <Link to="/terms">
              <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg border-border text-foreground hover:bg-accent">
                View Terms of Service
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default Privacy;
