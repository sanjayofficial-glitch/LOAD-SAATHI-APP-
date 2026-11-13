// Freddy AI Service — local knowledge answers only.
//
// Security note (SEC-04): this module previously called Groq / HuggingFace
// directly from the browser using API keys injected via VITE_GROQ_API_KEY /
// VITE_HUGGINGFACE_TOKEN and cached in localStorage. Those keys are now
// removed entirely. Freddy's AI answers are served by the server-side
// `agent-router` edge function (Clerk-JWT verified, rate-limited), and this
// fallback answers purely from the built-in knowledge base with no external
// calls and no stored credentials.
//
// Voice: Freddy speaks like a helpful colleague, not a brochure. Short
// sentences, contractions, one idea at a time, honest about limits, and
// always leaves a next step on the table. When the user writes in Hindi,
// answers come in Hindi (same honesty, same warmth).

interface AIResponse {
  success: boolean;
  message: string;
  providerUsed?: string;
}

class FreddyAI {
  async ask(question: string, _context?: string, lang: 'en' | 'hi' = 'en'): Promise<AIResponse> {
    const message =
      lang === 'hi'
        ? this.hindiKnowledgeBasedResponse(question)
        : this.knowledgeBasedResponse(question);
    return {
      success: true,
      message,
      providerUsed: 'knowledge-base',
    };
  }

  /** Rotate greetings so Freddy doesn't sound like a recording. */
  private greeting(): string {
    const greetings = [
      "Hey! I'm Freddy — your LoadSaathi copilot.",
      "Hi, it's Freddy here.",
      "Hello! Freddy at your service.",
    ];
    return (
      greetings[Math.floor(Math.random() * greetings.length)] ??
      "Hey! I'm Freddy — your LoadSaathi copilot."
    );
  }

  private hindiGreeting(): string {
    const greetings = [
      "नमस्ते! मैं फ्रेडी हूँ — आपका लोडसाथी साथी।",
      "हैलो, फ्रेडी यहाँ।",
      "नमस्कार! फ्रेडी आपकी मदद के लिए तैयार है।",
    ];
    return (
      greetings[Math.floor(Math.random() * greetings.length)] ??
      "नमस्ते! मैं फ्रेडी हूँ — आपका लोडसाथी साथी।"
    );
  }

  private knowledgeBasedResponse(question: string): string {
    const q = question.toLowerCase();

    if (q.includes('what is') || q.includes("what's") || q.includes('who are')) {
      return `${this.greeting()} I help shippers and truckers match up on freight across India — think of me as the person who knows the market, the rates, and how to get you moving.

We connect people with goods to trucks with space. It's free to join, and we only earn when a trip actually happens — no subscription, no hidden charges.

What are you hoping to do today: ship something, or carry something?`;
    }

    if (q.includes('shipp') || q.includes('goods') || q.includes('send')) {
      return `So you've got goods to move — that's the part I'm best at. Here's how it works in plain words:

1. Tell me where your goods start and where they need to go.
2. You'll see trucks on that route with live prices.
3. You pick the one that fits your budget and needs.
4. Once it's booked, you can track the trip in real time.

I can search the market for you right here — just say something like "find a truck from Rourkela to Ranchi for 5 tonnes" and I'll go look.

One honest note: I match you with what's actually on the marketplace. I never invent trucks or prices.`;
    }

    if (q.includes('truck') || q.includes('driver') || q.includes('earn')) {
      return `A truck that's running half-empty is money sitting on the road — so let's fix that.

Here's the simple version:
1. Tell me where your truck is and where you're headed.
2. I'll find open shipments on your route.
3. You compare loads, pick what works, and book.
4. Reliable drivers earn better ratings, which means more offers later.

Try asking me something like "find shipments from Bhubaneswar to Kolkata for 8 tonnes" and I'll search the live market for you right now.`;
    }

    if (q.includes('price') || q.includes('rate') || q.includes('cost') || q.includes('fare')) {
      return `Rates in freight are living numbers — they move with distance, load weight, vehicle type, fuel prices, and how much demand there is on that route that day.

The good news: you don't have to guess. We have free calculators (Fare Calculator, Freight Rate Calculator, PTL vs FTL) under Tools, and when you post a load or trip, I help suggest a fair price from real market data.

Want to price a specific route? Tell me the origin, destination, and weight — I'll pull the market for you.`;
    }

    if (q.includes('how') || q.includes('start') || q.includes('begin') || q.includes('work')) {
      return `Getting started is genuinely simple:

• Shippers: sign up, say "I have goods to ship", post your load, and trucks come to you.
• Truckers: sign up, say "I have truck space", and start seeing loads that match your route.

Both are free. If you'd rather not type it all out, tap "Find a truck" or "Find a load" on my home screen and I'll walk you through it step by step.`;
    }

    if (q.includes('contact') || q.includes('support') || q.includes('help') || q.includes('call')) {
      return `I'm happy to sort out most things right here, but for anything account-specific or urgent, our human team is genuinely responsive:

• WhatsApp: available from the Contact page.
• Call: our number is listed on the Contact page too.
• Form: /contact — they reply within 24 hours.

Meanwhile, what's the issue? If it's about a load, a trip, or a rate, I can almost certainly dig in now.`;
    }

    if (q.includes('payment') || q.includes('pay') || q.includes('charge') || q.includes('free')) {
      return `Straight answer: LoadSaathi is free to join, post, search, and chat. We don't charge subscriptions.

You only pay when a shipment or trip is actually booked through the platform — and you'll always see the price terms before you commit. No surprises, no "per lead" tricks.

Anything else about costs or payments I can clarify?`;
    }

    // Default fallback
    return `${this.greeting()} I can help you with:

• How LoadSaathi works (we're a freight matching marketplace for shippers and truckers)
• Finding trucks or loads on a live market
• Estimating fair freight rates
• Using our free calculator tools

If I don't know something, I'll say so and point you to a human — I won't make it up. What's on your mind?`;
  }

  private hindiKnowledgeBasedResponse(question: string): string {
    const q = question.toLowerCase();

    if (q.includes('क्या है') || q.includes('कौन') || q.includes('कैसे काम')) {
      return `${this.hindiGreeting()} मैं शिपर और ट्रकर को भारत भर में माल ढुलाई के लिए जोड़ता हूँ — मार्केट, रेट और सही गाड़ी तक पहुँचाना मेरा काम है।

हम माल वालों को ट्रक वालों से जोड़ते हैं। जुड़ना बिल्कुल मुफ़्त है, और हमें पैसा तभी मिलता है जब कोई ट्रिप सच में होती है — कोई सब्सक्रिप्शन नहीं, कोई छुपा चार्ज नहीं।

आज आप क्या करना चाहते हैं — माल भेजना है, या माल ढोना है?`;
    }

    if (q.includes('शिप') || q.includes('माल भेज') || q.includes('सामान') || q.includes('भेजना')) {
      return `तो आपको माल भेजना है — यही तो मेरा काम है। आसान शब्दों में:

1. बताइए माल कहाँ से कहाँ जाना है।
2. आपको उस रूट पर ट्रक दिखेंगे, असली दामों के साथ।
3. आप अपने बजट में फिट होने वाला ट्रक चुनिए।
4. बुक होने के बाद ट्रिप को लाइव ट्रैक कर सकते हैं।

मैं अभी यहीं मार्केट खोज सकता हूँ — बस ऐसे पूछिए: "राउरकेला से राँची के लिए 5 टन का ट्रक खोजें" और मैं देखता हूँ।

एक ईमानदार बात: मैं आपको वही दिखाता हूँ जो मार्केट में सच में है। मैं कभी नकली ट्रक या दाम नहीं बनाता।`;
    }

    if (q.includes('ट्रक') || q.includes('ड्राइवर') || q.includes('कमाई') || q.includes('कमाओ')) {
      return `आधा खाली ट्रक मतलब सड़क पर पड़ा पैसा — चलिए इसे ठीक करते हैं।

आसान तरीका:
1. बताइए आपका ट्रक कहाँ है और कहाँ जा रहा है।
2. मैं आपके रूट पर खुले शिपमेंट खोजूँगा।
3. लोड देखिए, चुनिए, और बुक कीजिए।
4. भरोसेमंद ड्राइवरों को बेहतर रेटिंग मिलती है — मतलब आगे ज़्यादा ऑफर।

ऐसे पूछिए: "भुवनेश्वर से कोलकाता के लिए 8 टन का शिपमेंट खोजें" — मैं अभी लाइव मार्केट देखता हूँ।`;
    }

    if (q.includes('कीमत') || q.includes('रेट') || q.includes('दाम') || q.includes('किराया') || q.includes('कॉस्ट')) {
      return `माल ढुलाई के दाम स्थिर नहीं होते — ये दूरी, वज़न, गाड़ी के प्रकार, डीज़ल की कीमत और उस दिन उस रूट पर डिमांड के हिसाब से बदलते हैं।

अच्छी खबर: आपको अंदाज़ा लगाने की ज़रूरत नहीं। हमारे पास मुफ़्त कैलकुलेटर हैं (फेयर कैलकुलेटर, फ्रेट रेट कैलकुलेटर, PTL vs FTL) — टूल्स में। और जब आप लोड या ट्रिप डालते हैं, तो मैं असली मार्केट डेटा से सही दाम सुझाता हूँ।

किसी खास रूट का दाम जानना है? ओरिजिन, डेस्टिनेशन और वज़न बताइए — मैं मार्केट देखता हूँ।`;
    }

    if (q.includes('कैसे शुरू') || q.includes('शुरू') || q.includes('कैसे काम') || q.includes('रजिस्टर') || q.includes('साइन अप')) {
      return `शुरू करना सच में आसान है:

• शिपर: साइन अप कीजिए, "मुझे माल भेजना है" चुनिए, लोड डालिए — ट्रक आपके पास आएँगे।
• ट्रकर: साइन अप कीजिए, "मेरे पास ट्रक है" चुनिए — और अपने रूट से मेल खाते लोड देखना शुरू कीजिए।

दोनों मुफ़्त हैं। अगर टाइप नहीं करना है, तो मेरी होम स्क्रीन पर "ट्रक खोजें" या "लोड खोजें" दबाइए — मैं कदम-दर-कदम साथ चलूँगा।`;
    }

    if (q.includes('संपर्क') || q.includes('सपोर्ट') || q.includes('मदद') || q.includes('कॉल') || q.includes('फोन')) {
      return `ज़्यादातर चीज़ें मैं यहीं सुलझा सकता हूँ, लेकिन खाते से जुड़ी या ज़रूरी बातों के लिए हमारी ह्यूमन टीम सच में तेज़ है:

• WhatsApp: कॉन्टैक्ट पेज से।
• कॉल: नंबर भी कॉन्टैक्ट पेज पर है।
• फॉर्म: /contact — 24 घंटे के अंदर जवाब मिलता है।

वैसे, समस्या क्या है? अगर लोड, ट्रिप या रेट की है, तो मैं अभी मदद कर सकता हूँ।`;
    }

    if (q.includes('पैसा') || q.includes('पेमेंट') || q.includes('चार्ज') || q.includes('मुफ़्त') || q.includes('फ्री')) {
      return `सीधा जवाब: लोडसाथी पर जुड़ना, लोड डालना, खोजना और चैट करना — सब मुफ़्त है। हम कोई सब्सक्रिप्शन नहीं लेते।

पैसा तभी देते हैं जब कोई शिपमेंट या ट्रिप सच में बुक होती है — और बुक करने से पहले दाम की शर्तें हमेशा साफ दिखती हैं। कोई सरप्राइज़ नहीं।

लागत या पेमेंट के बारे में और कुछ बताऊँ?`;
    }

    // Default fallback
    return `${this.hindiGreeting()} मैं इनमें मदद कर सकता हूँ:

• लोडसाथी कैसे काम करता है (शिपर और ट्रकर के लिए माल ढुलाई का मार्केटप्लेस)
• लाइव मार्केट में ट्रक या लोड खोजना
• सही फ्रेट रेट का अंदाज़ा
• हमारे मुफ़्त कैलकुलेटर टूल्स

अगर मुझे कुछ नहीं पता, तो मैं साफ कहूँगा और आपको इंसान तक पहुँचाऊँगा — मैं कुछ भी मनगढ़ंत नहीं बताऊँगा। आपके मन में क्या सवाल है?`;
  }
}

// Singleton instance
export const freddyAI = new FreddyAI();

// Purge any provider tokens previously cached in localStorage (SEC-04).
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('freddy_hf_token');
    localStorage.removeItem('freddy_groq_token');
  } catch {
    // localStorage unavailable (private mode) — nothing to purge.
  }
}
