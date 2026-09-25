import { Link } from "react-router-dom";
import SeoMeta from "@/components/SeoMeta";

const faqs = [
  {
    q: "PTL ट्रांसपोर्ट क्या होता है?",
    a: "PTL (पार्ट ट्रक लोड) में कई शिपर्स का माल एक ही ट्रक में जाता है। आप सिर्फ़ अपनी जगह/वज़न का किराया देते हैं — पूरा ट्रक बुक करने की ज़रूरत नहीं। 50 किलो से 3 टन तक के माल के लिए सबसे किफ़ायती विकल्प।",
  },
  {
    q: "PTL और FTL में क्या अंतर है?",
    a: "PTL में ट्रक साझा होता है और किराया प्रति किलो लगता है; डिलीवरी में 1–2 दिन ज़्यादा लग सकते हैं। FTL में पूरा ट्रक आपका होता है — तेज़ डायरेक्ट डिलीवरी, लेकिन 10 टन से कम माल पर महंगा पड़ता है।",
  },
  {
    q: "PTL बुकिंग पर कितनी बचत होती है?",
    a: "फुल ट्रक की तुलना में 30–40% तक। उदाहरण: राउरकेला–रांची (180 किमी) पर PTL दर लगभग ₹14–22/किलो है, जबकि पूरा ट्रक ₹15,300–21,600 का पड़ेगा।",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "PTL ट्रांसपोर्ट भारत — पार्ट ट्रक लोड बुकिंग",
      description: "MSME के लिए किफ़ायती PTL शिपिंग: 0.5–3 टन माल 30–40% कम लागत में भेजें।",
      url: "https://loadsaathi.in/hi/ptl-transport",
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

export default function HiPtlTransport() {
  return (
    <>
      <noscript>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "system-ui, sans-serif" }}>
          <h1>PTL ट्रांसपोर्ट भारत — पार्ट ट्रक लोड बुकिंग</h1>
          <p>PTL (पार्ट ट्रक लोड) में आपका माल दूसरे शिपर्स के माल के साथ एक ही ट्रक में जाता है। 0.5–3 टन के शिपमेंट पर FTL से 30–40% सस्ता। LoadSaathi पर AI-मैच्ड ट्रक, लाइव GPS ट्रैकिंग के साथ।</p>
        </div>
      </noscript>
      <SeoMeta
        title="PTL ट्रांसपोर्ट भारत — पार्ट ट्रक लोड बुकिंग"
        description="MSME के लिए किफ़ायती PTL शिपिंग: 0.5–3 टन माल 30–40% कम लागत में भेजें। AI-मैच्ड ट्रक, लाइव GPS ट्रैकिंग।"
        keywords="ptl transport hindi, part load booking, chhota maal bhejna, ptl vs ftl hindi"
        canonical="/hi/ptl-transport"
        hreflang="hi"
        jsonLd={jsonLd}
        breadcrumbs={[
          { name: "हिंदी", url: "/hi" },
          { name: "PTL ट्रांसपोर्ट", url: "/hi/ptl-transport" },
        ]}
      />
      <div className="min-h-screen bg-background dark:bg-[#050816]">
        <div className="max-w-[800px] mx-auto px-6 sm:px-12 py-16">
          <Link to="/hi" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← हिंदी होम
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mt-4 mb-6 text-foreground dark:text-white">
            PTL ट्रांसपोर्ट: छोटा माल, छोटा किराया
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
            PTL यानी पार्ट ट्रक लोड — जब आपका माल पूरा ट्रक भरने लायक न हो, तो दूसरे
            शिपर्स के साथ जगह साझा करें। 0.5 से 3 टन तक के शिपमेंट के लिए यह FTL (फुल
            ट्रक लोड) से 30–40% सस्ता पड़ता है। LoadSaathi का AI आपके माल को उसी रूट
            पर जा रहे ट्रक से मैच करता है।
          </p>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-10">
            हर PTL शिपमेंट पर लाइव GPS ट्रैकिंग, सत्यापित ट्रकर और एस्क्रो-सुरक्षित
            पेमेंट मिलता है। ओडिशा, झारखंड और पश्चिम बंगाल के सभी प्रमुख कॉरिडोर पर
            रोज़ाना लोड उपलब्ध। वज़न डालें, किराया देखें, बुक करें — बिना दलाल के।
          </p>

          <div className="overflow-x-auto rounded-xl border border-border mb-12">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 dark:bg-white/5 text-left">
                  <th className="px-4 py-3 font-bold text-foreground">विकल्प</th>
                  <th className="px-4 py-3 font-bold text-foreground">किराया</th>
                  <th className="px-4 py-3 font-bold text-foreground">कब चुनें</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 font-semibold text-foreground">PTL (साझा)</td>
                  <td className="px-4 py-3 text-muted-foreground">प्रति किलो, 30–40% सस्ता</td>
                  <td className="px-4 py-3 text-muted-foreground">50 किलो – 3 टन माल</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 font-semibold text-foreground">FTL (पूरा ट्रक)</td>
                  <td className="px-4 py-3 text-muted-foreground">पूरे ट्रक का फिक्स किराया</td>
                  <td className="px-4 py-3 text-muted-foreground">10 टन से ज़्यादा माल</td>
                </tr>
              </tbody>
            </table>
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

          <Link to="/ptl-transport" className="text-orange-600 dark:text-orange-400 underline underline-offset-2 text-sm">
            English में PTL ट्रांसपोर्ट पेज देखें
          </Link>
        </div>
      </div>
    </>
  );
}
