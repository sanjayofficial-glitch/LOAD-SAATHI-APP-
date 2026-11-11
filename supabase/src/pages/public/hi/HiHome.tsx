import { Link } from "react-router-dom";
import SeoMeta from "@/components/SeoMeta";

const faqs = [
  {
    q: "LoadSaathi क्या है?",
    a: "LoadSaathi भारत का AI-संचालित शेयर्ड फ्रेट मार्केटप्लेस है जो शिपर्स को सत्यापित ट्रकर्स से जोड़ता है। PTL (पार्ट ट्रक लोड), FTL (फुल ट्रक लोड) और रिटर्न लोड बुक करें — पूर्वी भारत के कई प्रकाशित फ्रेट कॉरिडोर पर लाइव GPS ट्रैकिंग के साथ।",
  },
  {
    q: "क्या LoadSaathi पर अकाउंट बनाना मुफ्त है?",
    a: "हाँ, शिपर्स और ट्रकर्स दोनों के लिए रजिस्ट्रेशन पूरी तरह मुफ्त है। केवल सफल शिपमेंट पर लेनदेन शुल्क लागू होता है — अंतिम दर प्रकाशित होगी। कोई सब्सक्रिप्शन नहीं, कोई छिपा शुल्क नहीं।",
  },
  {
    q: "LoadSaathi किन शहरों में काम करता है?",
    a: "राउरकेला, रांची, भुवनेश्वर, कोलकाता, जमशेदपुर सहित ओडिशा, झारखंड और पश्चिम बंगाल के 50+ शहर हमारे कवरेज डेटा में। राउरकेला–रांची–बर्धमान कॉरिडोर हमारा मुख्य नेटवर्क है।",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "LoadSaathi हिंदी — ऑनलाइन ट्रक बुकिंग",
      description:
        "पूर्वी भारत में AI-संचालित शेयर्ड फ्रेट मार्केटप्लेस। PTL, FTL और रिटर्न लोड बुक करें।",
      url: "https://loadsaathi.in/hi",
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

export default function HiHome() {
  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "system-ui, sans-serif" }}>
          <h2>भारत में ऑनलाइन ट्रक बुकिंग — LoadSaathi</h2>
          <p>LoadSaathi भारत का AI-संचालित शेयर्ड फ्रेट मार्केटप्लेस है। शिपर्स अपना माल पोस्ट करते हैं, AI सबसे उपयुक्त ट्रक से मैच करता है, और दोनों पक्ष लाइव GPS से शिपमेंट ट्रैक करते हैं। PTL और LTL लोड से माल भेजने पर अनुकूल लागत।</p>
          <h2>मुख्य सेवाएं</h2>
          <ul>
            <li><a href="https://loadsaathi.in/hi/ptl-transport">PTL ट्रांसपोर्ट</a> — छोटा माल साझा ट्रक में भेजें</li>
            <li><a href="https://loadsaathi.in/hi/return-load">रिटर्न लोड</a> — खाली वापसी पर कमाई करें</li>
            <li><a href="https://loadsaathi.in/hi/bhada-kaise-book-kare">भाड़ा कैसे बुक करें</a> — स्टेप-बाय-स्टेप गाइड</li>
          </ul>
        </div>
      </noscript>
      <SeoMeta
        title="ऑनलाइन ट्रक बुकिंग भारत — PTL/FTL भाड़ा"
        description="पूर्वी भारत में AI-संचालित शेयर्ड फ्रेट मार्केटप्लेस। PTL, FTL और रिटर्न लोड बुक करें — लाइव GPS ट्रैकिंग और सुरक्षित पेमेंट के साथ।"
        keywords="online truck booking hindi, truck book kaise kare, part load booking india, return load bharat"
        canonical="/hi"
        hreflang="hi"
        alternates={[{ hreflang: "en-in", href: "/" }]}
        jsonLd={jsonLd}
        breadcrumbs={[{ name: "हिंदी", url: "/hi" }]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816]">
        <div className="max-w-[800px] mx-auto px-6 sm:px-12 py-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-6 text-foreground dark:text-white">
            भारत में ऑनलाइन ट्रक बुकिंग
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
            LoadSaathi भारत का AI-संचालित शेयर्ड फ्रेट मार्केटप्लेस है जो शिपर्स को सत्यापित
            ट्रकर्स से जोड़ता है। अपना माल पोस्ट करें, AI सेकंडों में सबसे उपयुक्त ट्रक से
            मैच करे, और लाइव GPS ट्रैकिंग के साथ डिलीवरी तक नज़र रखें। खाली वापसी (empty
            backhaul) को पेड लोड में बदलें।
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-10">
            ओडिशा, झारखंड और पश्चिम बंगाल के 50+ शहरों का कवरेज डेटा और कई प्रकाशित फ्रेट कॉरिडोर।
            राउरकेला–रांची–बर्धमान हमारा मुख्य नेटवर्क है। रजिस्ट्रेशन मुफ्त — केवल सफल
            शिपमेंट पर लेनदेन शुल्क।
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            <Link to="/hi/ptl-transport" className="glass-card p-5 rounded-xl border border-border hover:border-orange-500/30 transition-all">
              <h2 className="font-bold text-foreground mb-1">PTL ट्रांसपोर्ट</h2>
              <p className="text-sm text-muted-foreground">छोटा माल साझा ट्रक में भेजें</p>
            </Link>
            <Link to="/hi/return-load" className="glass-card p-5 rounded-xl border border-border hover:border-orange-500/30 transition-all">
              <h2 className="font-bold text-foreground mb-1">रिटर्न लोड</h2>
              <p className="text-sm text-muted-foreground">खाली वापसी पर कमाई करें</p>
            </Link>
            <Link to="/hi/bhada-kaise-book-kare" className="glass-card p-5 rounded-xl border border-border hover:border-orange-500/30 transition-all">
              <h2 className="font-bold text-foreground mb-1">भाड़ा कैसे बुक करें</h2>
              <p className="text-sm text-muted-foreground">स्टेप-बाय-स्टेप गाइड</p>
            </Link>
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
            <Link to="/hi/route/rourkela-to-ranchi" className="text-orange-600 dark:text-orange-400 underline underline-offset-2">
              राउरकेला → रांची भाड़ा दरें
            </Link>
            <Link to="/" className="text-orange-600 dark:text-orange-400 underline underline-offset-2">
              English में देखें (View in English)
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
