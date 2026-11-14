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
  /** True when the KB had no answer and returned the honest "I don't know"
   *  fallback — callers can attach suggestion chips to avoid a dead end. */
  isFallback?: boolean;
}

class FreddyAI {
  /** Honest "I don't know" fallbacks — also used to flag isFallback so the
   *  UI can offer next-step chips. */
  private static readonly FALLBACK_EN =
    `I'm going to be straight with you: I don't have an answer for that yet. ` +
    `I'd rather say that than make something up — I won't make it up, and I ` +
    `won't invent trucks, loads, or prices.\n\n` +
    `Here's what I can help with right now:\n` +
    `• Finding trucks or shipments on the live market — try "find trucks from ` +
    `Rourkela to Ranchi for 5 tonnes"\n` +
    `• How LoadSaathi works, booking, live tracking, pricing, and trucker verification\n` +
    `• Our free calculators under Tools: Fare Calculator, Freight Rate Calculator, PTL vs FTL\n\n` +
    `If your question is about your account, a payment, a trip that's already moving, ` +
    `or anything specific to you, tap Help here or visit the Contact page (WhatsApp / ` +
    `call / form) and I'll point you to a human — they reply within 24 hours.`;

  private static readonly FALLBACK_HI =
    `मैं साफ बात करूँगा: इसका जवाब मेरे पास अभी नहीं है। मैं कुछ भी ` +
    `मनगढ़ंत नहीं बताऊँगा — और नकली ट्रक, लोड या दाम भी नहीं बनाऊँगा।\n\n` +
    `अभी मैं इनमें मदद कर सकता हूँ:\n` +
    `• लाइव मार्केट में ट्रक या शिपमेंट खोजना — जैसे "राउरकेला से राँची के लिए ` +
    `5 टन का ट्रक खोजें"\n` +
    `• लोडसाथी कैसे काम करता है, बुकिंग, लाइव ट्रैकिंग, दाम और ट्रकर वेरिफिकेशन\n` +
    `• टूल्स में हमारे मुफ़्त कैलकुलेटर: फेयर कैलकुलेटर, फ्रेट रेट कैलकुलेटर, PTL vs FTL\n\n` +
    `अगर सवाल आपके खाते, पेमेंट, चालू ट्रिप या किसी निजी चीज़ से जुड़ा है, तो यहाँ ` +
    `Help दबाइए या कॉन्टैक्ट पेज पर जाइए — मैं आपको इंसान तक पहुँचाऊँगा, ` +
    `वे 24 घंटे के अंदर जवाब देते हैं।`;

  async ask(question: string, _context?: string, lang: 'en' | 'hi' = 'en'): Promise<AIResponse> {
    const message =
      lang === 'hi'
        ? this.hindiKnowledgeBasedResponse(question)
        : this.knowledgeBasedResponse(question);
    const isFallback =
      lang === 'hi'
        ? message === FreddyAI.FALLBACK_HI
        : message === FreddyAI.FALLBACK_EN;
    return {
      success: true,
      message,
      providerUsed: 'knowledge-base',
      isFallback,
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

    // ── Credit score (server tool covers this; KB is graceful degradation) ──
    if (q.includes('credit') || q.includes('score')) {
      return `Your Digital Freight Credit Score and the factors behind it are visible on your Profile page. Verified profiles and completed, on-time trips raise it; cancellations and disputes lower it.

For a detailed breakdown with strengths and tips, ask again in a moment and I'll pull your private insights.`;
    }

    // ── Trucker / shipper verification (KYC) ──
    if (
      q.includes('verify') ||
      q.includes('verification') ||
      q.includes('kyc') ||
      q.includes('document') ||
      q.includes('pan') ||
      q.includes('badge') ||
      q.includes('trusted') ||
      q.includes('license') ||
      q.includes('licence')
    ) {
      return `Truckers can verify on the Verification page — upload your licence, vehicle documents, and identity (KYC). We review them, and once approved you get a ✓ Verified badge, which gets you more shipment requests.

Shippers can also strengthen their profile with verified business details. Documents are visible only to the LoadSaathi owner.`;
    }

    // ── Live trip tracking ──
    if (
      q.includes('track') ||
      q.includes('tracking') ||
      q.includes('where is my') ||
      q.includes('live location') ||
      q.includes('gps') ||
      q.includes('status of')
    ) {
      return `You can track an active trip live on its Trip page — open it from your Dashboard (My Trips for truckers, My Shipments for shippers). Live GPS tracking is available once the trip is underway, with milestones like pickup and delivery.

If a trip's location isn't updating, give it a few minutes; if it stays stuck, contact our team through the Contact page.`;
    }

    // ── Booking flow ──
    if (q.includes('book') || q.includes('booking') || q.includes('reserve')) {
      return `Booking works like this: a shipper finds a matching truck and sends a booking request; the trucker reviews and accepts it, and the trip starts. Shippers can also book a full truck directly from the Truck Load Booking page.

You'll always see the price and terms before you commit — no hidden surprises.`;
    }

    // ── Capability overview ("what can you do?") ──
    if (
      q.includes('what can you') ||
      q.includes('what do you do') ||
      q.includes('menu') ||
      q.includes('options') ||
      q.includes('capabilities')
    ) {
      return `Here's what I'm good at:

• LoadSaathi basics — how it works, who it's for.
• Finding trucks or loads — tell me a route, weight, and budget and I'll search the live market.
• Rates — fair freight pricing and our free calculators (Fare, Freight Rate, PTL vs FTL).
• Trust — your credit score, trucker verification, and safe practices.

What's on your mind?`;
    }

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

    if (q.includes('price') || q.includes('rate') || q.includes('cost') || q.includes('fare') || q.includes('calculator') || q.includes('tool') || q.includes('estimate') || q.includes('calculate')) {
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

    if (q.includes('contact') || q.includes('support') || q.includes('help') || q.includes('call') || q.includes('human') || q.includes('agent') || q.includes('person') || q.includes('cancel') || q.includes('refund') || q.includes('complaint') || q.includes('report') || q.includes('wrong')) {
      return `I'm happy to sort out most things right here, but for anything account-specific or urgent, our human team is genuinely responsive:

• WhatsApp: available from the Contact page.
• Call: our number is listed on the Contact page too.
• Form: /contact — they reply within 24 hours.

Cancellations, refunds, and account issues are handled directly by the team, so those are best raised there. Meanwhile, what's the issue? If it's about a load, a trip, or a rate, I can almost certainly dig in now.`;
    }

    if (q.includes('payment') || q.includes('pay') || q.includes('charge') || q.includes('free')) {
      return `Straight answer: LoadSaathi is free to join, post, search, and chat. We don't charge subscriptions.

You only pay when a shipment or trip is actually booked through the platform — and you'll always see the price terms before you commit. No surprises, no "per lead" tricks.

Anything else about costs or payments I can clarify?`;
    }

    // ── Safety & trust ──
    if (q.includes('safe') || q.includes('scam') || q.includes('fraud') || q.includes('secure') || q.includes('trust')) {
      return `LoadSaathi keeps payments and communication on-platform so you're protected. A few habits that keep you safe:

• Check ratings and the ✓ Verified badge before dealing with anyone.
• Never pay outside the platform — legitimate trip payments stay on LoadSaathi.
• Report anything suspicious through the Contact page; our team takes it seriously.`;
    }

    // ── Language preference ──
    if (q.includes('hindi') || q.includes('हिंदी') || q.includes('english') || q.includes('language')) {
      return `Sure! I can work in Hindi — just write your question in Hindi and I'll reply in Hindi. (मैं हिंदी में भी जवाब दे सकता हूँ — हिंदी में लिखिए।)`;
    }

    // ── Pleasantries ──
    if (/\b(thanks|thank you|bye|ok|great|nice|awesome|alright)\b/i.test(q)) {
      return `Anytime! Anything else about trucks, loads, rates, or how LoadSaathi works — I'm here.`;
    }

    // Default fallback — honest "I don't know", with next steps.
    return FreddyAI.FALLBACK_EN;
  }

  private hindiKnowledgeBasedResponse(question: string): string {
    const q = question.toLowerCase();

    // ── Credit score (Hindi) ──
    if (q.includes('क्रेडिट') || q.includes('स्कोर')) {
      return `आपका डिजिटल फ्रेट क्रेडिट स्कोर और उसके पीछे के कारक आपके प्रोफ़ाइल पेज पर दिखते हैं। वेरिफाइड प्रोफ़ाइल और समय पर पूरी हुई ट्रिपें इसे बढ़ाती हैं; कैंसल और विवाद इसे घटाते हैं।

विस्तृत जानकारी के लिए थोड़ी देर में दोबारा पूछिए — मैं आपके निजी इनसाइट्स निकाल दूँगा।`;
    }

    // ── Verification / KYC (Hindi) ──
    if (
      q.includes('वेरिफाई') ||
      q.includes('वेरिफिकेशन') ||
      q.includes('केवाईसी') ||
      q.includes('kyc') ||
      q.includes('दस्तावेज़') ||
      q.includes('पैन') ||
      q.includes('लाइसेंस') ||
      q.includes('बैज') ||
      q.includes('वेरिफाइड') ||
      q.includes('भरोसेमंद')
    ) {
      return `ट्रकर वेरिफिकेशन पेज पर अपना लाइसेंस, गाड़ी के दस्तावेज़ और पहचान (KYC) अपलोड कर सकते हैं। हम समीक्षा करते हैं, और मंज़ूरी मिलने पर आपको ✓ Verified बैज मिलता है — जिससे ज़्यादा शिपमेंट रिक्वेस्ट आती हैं।

शिपर भी वेरिफाइड बिज़नेस जानकारी से अपना प्रोफ़ाइल मज़बूत कर सकते हैं। दस्तावेज़ सिर्फ़ लोडसाथी के मालिक को दिखते हैं।`;
    }

    // ── Live tracking (Hindi) ──
    if (
      q.includes('ट्रैक') ||
      q.includes('ट्रैकिंग') ||
      q.includes('लाइव लोकेशन') ||
      q.includes('जीपीएस') ||
      q.includes('gps') ||
      q.includes('कहाँ है') ||
      q.includes('स्थिति')
    ) {
      return `आप चालू ट्रिप को उसके ट्रिप पेज पर लाइव ट्रैक कर सकते हैं — डैशबोर्ड से खोलिए (ट्रकर के लिए My Trips, शिपर के लिए My Shipments)। ट्रिप शुरू होने के बाद लाइव GPS ट्रैकिंग उपलब्ध होती है, पिकअप और डिलीवरी जैसे मील के पत्थरों के साथ।

अगर ट्रिप की लोकेशन अपडेट नहीं हो रही, तो कुछ मिनट रुकिए; फिर भी अटकी रहे तो कॉन्टैक्ट पेज से हमारी टीम से संपर्क कीजिए।`;
    }

    // ── Booking (Hindi) ──
    if (q.includes('बुक') || q.includes('बुकिंग') || q.includes('रिज़र्व')) {
      return `बुकिंग ऐसे काम करती है: शिपर एक मेल खाता ट्रक ढूँढता है और बुकिंग रिक्वेस्ट भेजता है; ट्रकर उसे देखकर स्वीकार करता है, और ट्रिप शुरू होती है। शिपर ट्रक लोड बुकिंग पेज से सीधे पूरा ट्रक भी बुक कर सकते हैं।

बुक करने से पहले दाम और शर्तें हमेशा साफ दिखती हैं — कोई छुपा सरप्राइज़ नहीं।`;
    }

    // ── Capability overview (Hindi) ──
    if (
      q.includes('क्या कर सकते') ||
      q.includes('क्या कर सकता') ||
      q.includes('मेन्यू') ||
      q.includes('विकल्प') ||
      q.includes('क्षमताएँ')
    ) {
      return `मैं इनमें मदद कर सकता हूँ:

• लोडसाथी की बुनियादी बातें — यह कैसे काम करता है, किसके लिए है।
• ट्रक या लोड खोजना — रूट, वज़न और बजट बताइए, मैं लाइव मार्केट देखता हूँ।
• दाम — सही फ्रेट रेट और हमारे मुफ़्त कैलकुलेटर (फेयर, फ्रेट रेट, PTL vs FTL)।
• भरोसा — आपका क्रेडिट स्कोर, ट्रकर वेरिफिकेशन और सुरक्षित तरीके।

आपके मन में क्या सवाल है?`;
    }

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

    if (q.includes('कीमत') || q.includes('रेट') || q.includes('दाम') || q.includes('किराया') || q.includes('कॉस्ट') || q.includes('कैलकुलेटर') || q.includes('टूल') || q.includes('अंदाज़ा') || q.includes('हिसाब')) {
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

    if (q.includes('संपर्क') || q.includes('सपोर्ट') || q.includes('मदद') || q.includes('कॉल') || q.includes('फोन') || q.includes('इंसान') || q.includes('कैंसल') || q.includes('रिफंड') || q.includes('शिकायत') || q.includes('रिपोर्ट')) {
      return `ज़्यादातर चीज़ें मैं यहीं सुलझा सकता हूँ, लेकिन खाते से जुड़ी या ज़रूरी बातों के लिए हमारी ह्यूमन टीम सच में तेज़ है:

• WhatsApp: कॉन्टैक्ट पेज से।
• कॉल: नंबर भी कॉन्टैक्ट पेज पर है।
• फॉर्म: /contact — 24 घंटे के अंदर जवाब मिलता है।

कैंसल, रिफंड और खाते से जुड़े मामले सीधे टीम संभालती है, इसलिए वे वहीं उठाना सबसे सही है। वैसे, समस्या क्या है? अगर लोड, ट्रिप या रेट की है, तो मैं अभी मदद कर सकता हूँ।`;
    }

    if (q.includes('पैसा') || q.includes('पेमेंट') || q.includes('चार्ज') || q.includes('मुफ़्त') || q.includes('फ्री')) {
      return `सीधा जवाब: लोडसाथी पर जुड़ना, लोड डालना, खोजना और चैट करना — सब मुफ़्त है। हम कोई सब्सक्रिप्शन नहीं लेते।

पैसा तभी देते हैं जब कोई शिपमेंट या ट्रिप सच में बुक होती है — और बुक करने से पहले दाम की शर्तें हमेशा साफ दिखती हैं। कोई सरप्राइज़ नहीं।

लागत या पेमेंट के बारे में और कुछ बताऊँ?`;
    }

    // ── Safety & trust (Hindi) ──
    if (q.includes('सुरक्षित') || q.includes('ठगी') || q.includes('धोखा') || q.includes('स्कैम') || q.includes('फ्रॉड') || q.includes('भरोसा')) {
      return `लोडसाथी पेमेंट और बातचीत को प्लेटफ़ॉर्म पर ही रखती है, ताकि आप सुरक्षित रहें। कुछ आदतें जो आपको बचाती हैं:

• किसी से भी व्यवहार से पहले रेटिंग और ✓ Verified बैज देखिए।
• प्लेटफ़ॉर्म के बाहर कभी पैसा न दें — सही ट्रिप पेमेंट हमेशा लोडसाथी पर ही रहता है।
• कुछ भी संदिग्ध लगे तो कॉन्टैक्ट पेज से रिपोर्ट कीजिए; हमारी टीम इसे गंभीरता से लेती है।`;
    }

    // ── Language preference (Hindi) ──
    if (q.includes('हिंदी') || q.includes('अंग्रेज़ी') || q.includes('भाषा') || q.includes('english')) {
      return `ज़रूर! मैं हिंदी में भी जवाब दे सकता हूँ — बस अपना सवाल हिंदी में लिखिए, मैं हिंदी में जवाब दूँगा। (Sure! Write in Hindi and I'll reply in Hindi.)`;
    }

    // ── Pleasantries (Hindi) ──
    if (q.includes('धन्यवाद') || q.includes('शुक्रिया') || q.includes('ठीक है') || q.includes('बढ़िया') || q.includes('अच्छा') || q.includes('शानदार')) {
      return `जी, कोई बात नहीं! ट्रक, लोड, रेट या लोडसाथी के बारे में और कुछ पूछना हो तो मैं यहीं हूँ।`;
    }

    // Default fallback — honest "I don't know", with next steps.
    return FreddyAI.FALLBACK_HI;
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
