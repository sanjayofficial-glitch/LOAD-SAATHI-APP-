import { Link } from "react-router-dom";
import SeoMeta from "@/components/SeoMeta";

const steps = [
  {
    name: "माल की जानकारी डालें",
    text: "कहां से कहां भेजना है, माल का वज़न, सामान का प्रकार और तारीख लिखें। इसमें 3 मिनट से कम लगता है।",
  },
  {
    name: "AI ट्रक मैच करे",
    text: "सिस्टम रूट, क्षमता, किराया और ट्रकर की रेटिंग देखकर सबसे उपयुक्त ट्रक चुनता है।",
  },
  {
    name: "बुक करें और ट्रैक करें",
    text: "मैच कन्फर्म करें और पिकअप से डिलीवरी तक लाइव GPS पर नज़र रखें।",
  },
  {
    name: "पेमेंट और रिव्यू",
    text: "एस्क्रो के ज़रिए सुरक्षित पेमेंट करें और रिव्यू देकर अपनी डिजिटल साख बनाएं।",
  },
];

const faqs = [
  {
    q: "ट्रक बुक करने के लिए कौन से कागज़ चाहिए?",
    a: "आमतौर पर GST इनवॉइस, ₹50,000 से ज़्यादा माल पर e-Way Bill, और ट्रांसपोर्टर की GSTIN जानकारी। LoadSaathi बुकिंग के साथ e-Way Bill Part-A लिंक करने में मदद करता है।",
  },
  {
    q: "क्या बिना दलाल के सीधे ट्रक मिलेगा?",
    a: "हाँ, यही LoadSaathi का मकसद है — शिपर सीधे सत्यापित ट्रकर से जुड़ता है, बीच में कोई कमीशनखोर नहीं। इससे भाड़ा 25–35% तक कम पड़ता है।",
  },
  {
    q: "पेमेंट कैसे सुरक्षित रहता है?",
    a: "पैसा एस्क्रो में रहता है और डिलीवरी के माइलस्टोन पूरे होने पर ही जारी होता है। 30–45 दिन के उधार चक्र के बजाय तेज़ डिजिटल सेटलमेंट मिलता है।",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "ट्रक भाड़ा कैसे बुक करें — स्टेप-बाय-स्टेप गाइड",
      description: "बिना दलाल के ऑनलाइन ट्रक बुक करने की पूरी प्रक्रिया: माल पोस्ट करना, AI मैचिंग, GPS ट्रैकिंग और सुरक्षित पेमेंट।",
      datePublished: "2026-09-25",
      dateModified: "2026-09-25",
      image: "https://loadsaathi.in/og-image.png",
      author: { "@type": "Person", name: "LoadSaathi Team" },
      publisher: {
        "@type": "Organization",
        name: "LoadSaathi",
        url: "https://loadsaathi.in",
        logo: { "@type": "ImageObject", url: "https://loadsaathi.in/logo-512.png" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": "https://loadsaathi.in/hi/bhada-kaise-book-kare" },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", ".hi-guide-summary"],
      },
    },
    {
      "@type": "HowTo",
      name: "ट्रक भाड़ा कैसे बुक करें",
      description: "बिना दलाल के ऑनलाइन ट्रक बुक करने की पूरी प्रक्रिया।",
      totalTime: "PT10M",
      step: steps.map((s) => ({
        "@type": "HowToStep",
        name: s.name,
        text: s.text,
      })),
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

export default function HiBhadaGuide() {
  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "system-ui, sans-serif" }}>
          <h2>ट्रक भाड़ा कैसे बुक करें — स्टेप-बाय-स्टेप गाइड</h2>
          <p>बिना दलाल के ऑनलाइन ट्रक बुक करें: (1) माल की जानकारी डालें, (2) AI ट्रक मैच करे, (3) बुक करके GPS पर ट्रैक करें, (4) एस्क्रो से सुरक्षित पेमेंट करें।</p>
        </div>
      </noscript>
      <SeoMeta
        title="ट्रक भाड़ा कैसे बुक करें — स्टेप-बाय-स्टेप गाइड"
        description="बिना दलाल के ऑनलाइन ट्रक बुक करने की पूरी प्रक्रिया: माल पोस्ट करना, AI मैचिंग, GPS ट्रैकिंग और सुरक्षित पेमेंट।"
        keywords="truck kaise book kare, bhada booking online, bina dalal truck, maal bhejne ka tarika"
        canonical="/hi/bhada-kaise-book-kare"
        hreflang="hi"
        jsonLd={jsonLd}
        breadcrumbs={[
          { name: "हिंदी", url: "/hi" },
          { name: "भाड़ा गाइड", url: "/hi/bhada-kaise-book-kare" },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816]">
        <div className="max-w-[800px] mx-auto px-6 sm:px-12 py-16">
          <Link to="/hi" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← हिंदी होम
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mt-4 mb-6 text-foreground dark:text-white">
            ट्रक भाड़ा कैसे बुक करें
          </h1>
          <div className="glass-card p-6 rounded-xl border border-orange-500/20 dark:border-orange-500/10 mb-10">
            <p className="hi-guide-summary text-sm sm:text-base text-foreground leading-relaxed font-medium">
              दलाल को फोन लगाकर दिन बर्बाद करने के बजाय ऑनलाइन बुक करें: माल पोस्ट
              करें, AI सेकंडों में सत्यापित ट्रक से मैच करे, GPS पर लाइव ट्रैक करें
              और एस्क्रो से सुरक्षित पेमेंट पाएं। पूरी प्रक्रिया 10 मिनट में।
            </p>
          </div>

          <h2 className="text-2xl font-black text-foreground mb-6">4 आसान स्टेप</h2>
          <ol className="space-y-4 mb-12">
            {steps.map((s, i) => (
              <li key={i} className="glass-card p-6 rounded-xl border-border dark:border-white/[0.08]">
                <h3 className="font-bold text-foreground mb-2">
                  स्टेप {i + 1}: {s.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>

          <h2 className="text-2xl font-black text-foreground mb-6">अक्सर पूछे जाने वाले प्रश्न</h2>
          <div className="space-y-4 mb-12">
            {faqs.map((f, i) => (
              <div key={i} className="glass-card p-6 rounded-xl border-border dark:border-white/[0.08]">
                <h3 className="font-bold text-foreground mb-2">{f.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>

          <Link to="/how-it-works" className="text-orange-600 dark:text-orange-400 underline underline-offset-2 text-sm">
            English में पूरी प्रक्रिया देखें
          </Link>
        </div>
      </div>
    </>
  );
}
