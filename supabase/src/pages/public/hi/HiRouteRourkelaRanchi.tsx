import { Link } from "react-router-dom";
import SeoMeta from "@/components/SeoMeta";

const faqs = [
  {
    q: "राउरकेला से रांची भाड़ा कितना है?",
    a: "FTL (पूरा ट्रक) का किराया लगभग ₹15,300–21,600 (180 किमी) और PTL (साझा माल) लगभग ₹14–22 प्रति किलो है। सही किराया ट्रक के प्रकार और माल के वज़न पर निर्भर करता है — फेयर कैलकुलेटर से तुरंत अनुमान पाएं।",
  },
  {
    q: "राउरकेला से रांची पहुंचने में कितना समय लगता है?",
    a: "डायरेक्ट FTL में लगभग 4 घंटे। PTL में कंसॉलिडेशन स्टॉप के कारण 5–6 घंटे लग सकते हैं। LoadSaathi की GPS ट्रैकिंग से लाइव ETA मिलता रहता है।",
  },
  {
    q: "क्या इस रूट पर PTL सुविधा है?",
    a: "हाँ। 3 टन से कम माल के लिए PTL सबसे किफ़ायती है — पूरा ट्रक लेने की तुलना में 40% तक बचत। LoadSaathi का AI उसी रूट के ट्रक से मैच करता है।",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "राउरकेला से रांची भाड़ा दर — PTL/FTL ट्रक बुकिंग",
      description: "राउरकेला–रांची (180 किमी) कॉरिडोर पर PTL ₹14–22/किलो, FTL ₹15,300–21,600। लाइव GPS ट्रैकिंग के साथ बुक करें।",
      url: "https://loadsaathi.in/hi/route/rourkela-to-ranchi",
      inLanguage: "hi",
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function HiRouteRourkelaRanchi() {
  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "system-ui, sans-serif" }}>
          <h2>राउरकेला से रांची भाड़ा — PTL/FTL ट्रक बुकिंग</h2>
          <p>राउरकेला–रांची (180 किमी) कॉरिडोर: PTL लगभग ₹14–22/किलो, FTL लगभग ₹15,300–21,600। समय ~4 घंटे। LoadSaathi पर सत्यापित ट्रक, GPS ट्रैकिंग।</p>
        </div>
      </noscript>
      <SeoMeta
        title="राउरकेला से रांची भाड़ा — PTL/FTL ट्रक बुकिंग"
        description="राउरकेला–रांची (180 किमी) कॉरिडोर पर PTL ₹14–₹22/किलो, FTL ₹15,300–₹21,600। लाइव GPS ट्रैकिंग के साथ बुक करें।"
        keywords="rourkela ranchi bhada, rourkela se ranchi truck, ranchi freight rate hindi"
        canonical="/hi/route/rourkela-to-ranchi"
        hreflang="hi"
        jsonLd={jsonLd}
        breadcrumbs={[
          { name: "हिंदी", url: "/hi" },
          { name: "राउरकेला → रांची", url: "/hi/route/rourkela-to-ranchi" },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816]">
        <div className="max-w-[800px] mx-auto px-6 sm:px-12 py-16">
          <Link to="/hi" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← हिंदी होम
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mt-4 mb-6 text-foreground dark:text-white">
            राउरकेला से रांची भाड़ा दर
          </h1>
          <p className="hi-route-snippet text-base sm:text-lg text-foreground leading-relaxed mb-6 font-medium">
            राउरकेला से रांची (180 किमी) पर PTL भाड़ा लगभग ₹14–22 प्रति किलो और पूरे
            ट्रक (FTL) का किराया लगभग ₹15,300–21,600 है। सफ़र में करीब 4 घंटे लगते
            हैं। LoadSaathi पर स्टील सिटी से झारखंड की राजधानी तक सत्यापित ट्रक,
            लाइव GPS ट्रैकिंग के साथ बुक करें।
          </p>
          <div className="grid grid-cols-3 gap-3 mb-12">
            <div className="glass-card p-4 rounded-xl border border-border text-center">
              <p className="text-lg font-black text-foreground">180 किमी</p>
              <p className="text-xs text-muted-foreground">कुल दूरी</p>
            </div>
            <div className="glass-card p-4 rounded-xl border border-border text-center">
              <p className="text-lg font-black text-foreground">~4 घंटे</p>
              <p className="text-xs text-muted-foreground">सफ़र समय</p>
            </div>
            <div className="glass-card p-4 rounded-xl border border-border text-center">
              <p className="text-lg font-black text-foreground">PTL / FTL</p>
              <p className="text-xs text-muted-foreground">भाड़ा प्रकार</p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-foreground mb-6">अक्सर पूछे जाने वाले प्रश्न</h2>
          <div className="space-y-4 mb-12">
            {faqs.map((f, i) => (
              <div key={i} className="glass-card p-6 rounded-xl border-border dark:border-white/[0.08]">
                <h3 className="font-bold text-foreground mb-2">{f.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 text-sm">
            <Link to="/routes/rourkela-to-ranchi" className="text-orange-600 dark:text-orange-400 underline underline-offset-2">
              English में यह रूट देखें
            </Link>
            <Link to="/hi/ptl-transport" className="text-orange-600 dark:text-orange-400 underline underline-offset-2">
              PTL ट्रांसपोर्ट के बारे में
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
