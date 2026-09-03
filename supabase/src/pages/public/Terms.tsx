
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeoMeta from "@/components/SeoMeta";

const sections = [
  {
    title: "Acceptance of Terms",
    content: "By accessing or using LoadSaathi ('the Platform'), you agree to be bound by these Terms of Service ('Terms'). If you do not agree to all of these Terms, do not use the Platform. LoadSaathi reserves the right to update or modify these Terms at any time without prior notice. Your continued use of the Platform after any changes constitutes acceptance of the new Terms.",
  },
  {
    title: "Description of Services",
    content: "LoadSaathi is a digital marketplace platform that connects shippers with transporters for the purpose of freight and logistics services. The Platform provides AI-powered matching, real-time tracking, payment processing, digital documentation, and credit scoring services. LoadSaathi facilitates transactions between users but is not a party to any shipping or transportation agreement between shippers and transporters.",
  },
  {
    title: "User Accounts & Registration",
    content: [
      "You must be at least 18 years old and legally capable of entering into binding contracts to use LoadSaathi.",
      "You must provide accurate, current, and complete information during registration and maintain the accuracy of such information.",
      "You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
      "You must notify LoadSaathi immediately of any unauthorized use of your account or any other breach of security.",
      "LoadSaathi reserves the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.",
    ],
  },
  {
    title: "User Obligations",
    content: [
      "Provide accurate information about shipments, vehicles, and availability at all times.",
      "Complete accepted shipments in a professional and timely manner.",
      "Communicate respectfully with other users through the platform.",
      "Not engage in any activity that circumvents platform fees or transactions.",
      "Comply with all applicable laws and regulations including transportation, tax, and customs laws.",
      "Not use the platform for any illegal, fraudulent, or unauthorized purpose.",
    ],
  },
  {
    title: "Transaction & Payment Terms",
    content: [
      "All transactions facilitated through LoadSaathi are governed by a separate agreement between the shipper and transporter.",
      "LoadSaathi charges a service fee for each completed transaction, which will be clearly disclosed before transaction confirmation.",
      "Payments are processed through our secure escrow system. Funds are released to the transporter upon successful delivery confirmation by the shipper.",
      "In case of disputes, LoadSaathi may hold funds in escrow until the dispute is resolved through our dispute resolution process.",
      "Users are responsible for all applicable taxes, duties, and levies associated with their transactions.",
    ],
  },
  {
    title: "Digital Freight Credit Score",
    content: [
      "LoadSaathi maintains a proprietary credit scoring system for all users based on platform activity, transaction history, and user feedback.",
      "Credit scores are calculated using algorithms that may be updated from time to time.",
      "Users can improve their credit score by completing transactions successfully, maintaining high ratings, and providing complete documentation.",
      "LoadSaathi may restrict platform access or features based on credit score thresholds.",
      "Credit scores are for platform use only and do not constitute financial credit scores or recommendations.",
    ],
  },
  {
    title: "Intellectual Property",
    content: "All content, features, and functionality of the Platform — including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and software — are the exclusive property of LoadSaathi Technologies Pvt. Ltd. or its licensors and are protected by Indian and international copyright, trademark, and other intellectual property laws.",
  },
  {
    title: "Limitation of Liability",
    content: [
      "LoadSaathi provides the platform on an 'as is' and 'as available' basis without warranties of any kind, either express or implied.",
      "LoadSaathi shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the platform.",
      "LoadSaathi's total liability for any claim arising from these Terms or the platform shall not exceed the total fees paid by you to LoadSaathi in the twelve months preceding the claim.",
      "LoadSaathi is not responsible for the acts or omissions of any user, including but not limited to failure to deliver goods, damage to cargo, or breach of contract.",
    ],
  },
  {
    title: "Dispute Resolution",
    content: [
      "Users agree to first attempt to resolve any disputes informally through LoadSaathi's internal dispute resolution process.",
      "If a dispute cannot be resolved informally, it shall be settled by binding arbitration in accordance with the Arbitration and Conciliation Act, 1996.",
      "The arbitration shall be conducted in Bengaluru, Karnataka, in English.",
      "Each party shall bear its own costs of arbitration unless otherwise determined by the arbitrator.",
    ],
  },
  {
    title: "Governing Law",
    content: "These Terms shall be governed by and construed in accordance with the laws of India. Any legal action or proceeding arising out of or relating to these Terms shall be brought exclusively in the courts of Bengaluru, Karnataka.",
  },
  {
    title: "Termination",
    content: "Either party may terminate this agreement at any time by providing written notice. LoadSaathi may suspend or terminate your access to the Platform immediately without prior notice if you violate these Terms. Upon termination, your right to use the Platform will immediately cease. Provisions relating to payment, intellectual property, limitation of liability, and dispute resolution shall survive termination.",
  },
  {
    title: "Contact Information",
    content: "For questions about these Terms, please contact us at legal@loadsaathi.com or write to us at LoadSaathi Technologies Pvt. Ltd., Bengaluru, Karnataka, India.",
  },
];

const Terms = () => {
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
      title="Terms of Service"
      description="LoadSaathi's terms of service — the rules and guidelines for using our freight marketplace platform. Please read these terms carefully before using LoadSaathi."
      keywords="LoadSaathi terms of service, freight marketplace terms, logistics platform terms India"
      canonical="/terms"
      breadcrumbs={[{ name: "Terms of Service", url: "/terms" }]}
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
            Terms of <span className="text-gradient-orange-blue">Service</span>
          </h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="fade-section py-16 relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-12 relative z-10">
          <div className="glass-card p-8 sm:p-10 rounded-xl border-border dark:border-white/[0.08] mb-10">
            <p className="text-muted-foreground leading-relaxed">
              Welcome to LoadSaathi. These Terms of Service govern your use of the LoadSaathi platform and services. By creating an account or using the platform, you agree to these Terms. Please read them carefully.
            </p>
          </div>

          <div className="space-y-10">
            {sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-xl sm:text-2xl font-black text-foreground dark:text-white mb-4 pb-3 border-b border-border">
                  {i + 1}. {section.title}
                </h2>
                {typeof section.content === "string" ? (
                  <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                ) : (
                  <ul className="space-y-3">
                    {section.content.map((item, j) => (
                      <li key={j} className="flex items-start gap-3 text-muted-foreground">
                        <span className="text-orange-500 mt-1 select-none text-xs font-bold">{String(j + 1).padStart(2, "0")}</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="fade-section py-16 relative overflow-hidden bg-muted/30 dark:bg-[#010f1f] border-y border-border dark:border-white/5">
        <div className="max-w-xl w-full mx-auto px-6 sm:px-12 relative z-10 text-center">
          <FileText className="h-10 w-10 text-orange-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-foreground dark:text-white mb-4">Have Legal Questions?</h2>
          <p className="text-muted-foreground mb-8">Reach out to our legal team for clarification.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                Contact Us
              </Button>
            </Link>
            <Link to="/privacy">
              <Button variant="outline" className="text-sm font-bold tracking-wider uppercase px-8 py-4 h-auto rounded-lg border-border text-foreground hover:bg-accent">
                View Privacy Policy
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default Terms;
