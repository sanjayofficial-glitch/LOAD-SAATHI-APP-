import { Link } from "react-router-dom";
import SeoMeta from "@/components/SeoMeta";

const faqs = [
  {
    q: "रिटर्न लोड क्या होता है?",
    a: "माल उतारने के बाद ट्रक अक्सर खाली लौटता है — इसे empty running कहते हैं। उसी वापसी रूट पर दूसरा माल मिल जाए तो वही रिटर्न लोड है। खाली चलने में ₹35–45 प्रति किमी का नुकसान होता है; रिटर्न लोड से वही सफ़र कमाई बन जाता है।",
  },
  {
    q: "रिटर्न लोड से ट्रक मालिक कितना ज़्यादा कमा सकता है?",
    a: "आमतौर पर राउंड ट्रिप पर 40–60% ज़्यादा। उदाहरण: रांची–कोलकाता एक तरफ़ ₹25,000–35,000 मिलता है; वापसी लोड के साथ कुल ₹50,000–65,000 तक पहुंच जाता है।",
  },
  {
    q: "LoadSaathi पर रिटर्न लोड कैसे खोजें?",
    a: "रजिस्टर करें, अपना रूट और खाली क्षमता डालें — AI उसी दिशा के शिपमेंट से मैच करेगा। डिलीवरी से 24–48 घंटे पहले उपलब्धता डालने पर सबसे अच्छे लोड मिलते हैं।",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "रिटर्न लोड भारत — खाली वापसी पर कमाई",
      description: "डिलीवरी के बाद खाली लौटने के बजाय वापसी का माल पाएं। राउंड ट्रिप पर 40–60% ज़्यादा कमाई।",
      url: "https://loadsaathi.in/hi/return-load",
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

export default function HiReturnLoad() {
  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "system-ui, sans-serif" }}>
          <h2>रिटर्न लोड — खाली वापसी पर कमाई</h2>
          <p>माल उतारकर खाली लौटना ट्रक मालिकों का सबसे बड़ा नुकसान है। LoadSaathi वापसी रूट के लोड से मैच करता है — राउंड ट्रिप पर 40–60% ज़्यादा कमाई।</p>
        </div>
      </noscript>
      <SeoMeta
        title="रिटर्न लोड भारत — खाली वापसी पर कमाई"
        description="डिलीवरी के बाद खाली लौटने के बजाय वापसी का माल पाएं। AI मैचिंग से राउंड ट्रिप पर 40–60% ज़्यादा कमाई।"
        keywords="return load hindi, khali truck load, wapsi ka maal, return load kaise milega"
        canonical="/hi/return-load"
        hreflang="hi"
        alternates={[{ hreflang: "en-in", href: "/return-load" }]}
        jsonLd={jsonLd}
        breadcrumbs={[
          { name: "हिंदी", url: "/hi" },
          { name: "रिटर्न लोड", url: "/hi/return-load" },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816]">
        <div className="max-w-[800px] mx-auto px-6 sm:px-12 py-16">
          <Link to="/hi" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← हिंदी होम
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mt-4 mb-6 text-foreground dark:text-white">
            रिटर्न लोड: खाली वापसी को कमाई बनाएं
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
            हर खाली किलोमीटर पैसों की बर्बादी है — डीज़ल, टोल, ड्राइवर और मेंटेनेंस
            मिलाकर खाली ट्रक पर भी ₹35–45 प्रति किमी खर्च होता है। 500 किमी की खाली
            वापसी यानी ₹17,500–22,500 का सीधा नुकसान। रिटर्न लोड इसी नुकसान को कमाई
            में बदलता है।
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-10">
            LoadSaathi पर डिलीवरी से 24–48 घंटे पहले अपनी उपलब्धता डालें — AI आपकी
            वापसी दिशा के शिपमेंट खोजकर पहले से मैच कर देगा। रांची–कोलकाता जैसे रूट
            पर वापसी लोड के साथ शुद्ध मुनाफ़ा दोगुना तक हो जाता है। क्रेडिट स्कोर
            अच्छा रखें — ज़्यादा स्कोर वालों को प्रायोरिटी मैचिंग मिलती है।
          </p>

          <h2 className="text-2xl font-black text-foreground mb-6">अक्सर पूछे जाने वाले प्रश्न</h2>
          <div className="space-y-4 mb-12">
            {faqs.map((f, i) => (
              <div key={i} className="glass-card p-6 rounded-xl border-border dark:border-white/[0.08]">
                <h3 className="font-bold text-foreground mb-2">{f.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>

          <Link to="/return-load" className="text-orange-600 dark:text-orange-400 underline underline-offset-2 text-sm">
            English में रिटर्न लोड पेज देखें
          </Link>
        </div>
      </div>
    </>
  );
}
