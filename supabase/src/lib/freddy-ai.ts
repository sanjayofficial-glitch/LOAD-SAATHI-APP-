// Freddy AI Service — local knowledge answers only.
//
// Security note (SEC-04): this module previously called Groq / HuggingFace
// directly from the browser using API keys injected via VITE_GROQ_API_KEY /
// VITE_HUGGINGFACE_TOKEN and cached in localStorage. Those keys are now
// removed entirely. Freddy's AI answers are served by the server-side
// `agent-router` edge function (Clerk-JWT verified, rate-limited), and this
// fallback answers purely from the built-in knowledge base with no external
// calls and no stored credentials.

interface AIResponse {
  success: boolean;
  message: string;
  providerUsed?: string;
  error?: string;
}

class FreddyAI {
  async ask(question: string, _context?: string, _lang: 'en' | 'hi' = 'en'): Promise<AIResponse> {
    return {
      success: true,
      message: this.knowledgeBasedResponse(question),
      providerUsed: 'knowledge-base',
    };
  }

  private knowledgeBasedResponse(question: string): string {
    const lowerQuestion = question.toLowerCase();

    // Simple keyword-based responses as fallback
    if (lowerQuestion.includes('what is') || lowerQuestion.includes('what\'s') || lowerQuestion.includes('who are')) {
      return `Hi! I'm Freddy, your LoadSaathi assistant! 🎯

LoadSaathi is an AI-powered freight marketplace that connects shippers with truckers across India. We help you:
• Shippers: Post loads and find verified truckers at fair prices
• Truckers: Find loads to fill your empty truck space

It's completely free to sign up! Want me to guide you on getting started?`;
    }

    if (lowerQuestion.includes('shipp') || lowerQuestion.includes('goods') || lowerQuestion.includes('send')) {
      return `Great question! As a shipper on LoadSaathi:

1. **Post Your Load** - Enter origin, destination, weight, and timeline
2. **Get Matches** - Our AI finds suitable truckers on your route
3. **Compare & Choose** - Review rates and truck details
4. **Track** - Monitor your shipment in real-time
5. **Rate** - Build your credit score with reviews

It's FREE to post loads! Start here: /register

Need help with something specific like pricing or finding trucks?`;
    }

    if (lowerQuestion.includes('truck') || lowerQuestion.includes('driver') || lowerQuestion.includes('earn')) {
      return `Hey trucker! 🚛 Here's how LoadSaathi helps you earn more:

1. **Post Your Trip** - Share your route and available capacity
2. **Find Loads** - Browse shipments matching your route
3. **Get Fair Prices** - AI suggests market rates so you don't undercharge
4. **Track Earnings** - See all your trips and income
5. **Build Reputation** - Good ratings = more opportunities

Fill empty space and earn more on every trip! Join free: /register

Want to know about rates or finding loads in your area?`;
    }

    if (lowerQuestion.includes('price') || lowerQuestion.includes('rate') || lowerQuestion.includes('cost') || lowerQuestion.includes('fare')) {
      return `Freight rates depend on several factors:
• Distance between cities
• Weight/volume of goods
• Vehicle type (truck size)
• Market demand
• Fuel prices

We offer FREE calculator tools to help estimate rates:
• Fare Calculator: /tools/fare-calculator
• Freight Rate Calculator: /tools/freight-rate-calculator
• PTL vs FTL Calculator: /tools/ptl-vs-ftl-calculator

Our AI also suggests fair prices when you post loads or trips! Want to try a calculator?`;
    }

    if (lowerQuestion.includes('how') || lowerQuestion.includes('start') || lowerQuestion.includes('begin')) {
      return `Getting started with LoadSaathi is simple! 🚀

**For Shippers:**
1. Sign up for free at /register
2. Choose "I have goods to ship"
3. Post your first load with details
4. Get matched with truckers instantly

**For Truckers:**
1. Sign up at /register
2. Choose "I have truck space"
3. Post your trip or browse loads
4. Start earning!

Both are 100% free to start. Need help with anything specific?`;
    }

    if (lowerQuestion.includes('contact') || lowerQuestion.includes('support') || lowerQuestion.includes('help') || lowerQuestion.includes('call')) {
      return `I'm here to help! For direct support:

📞 **Contact Us:** /contact
• Fill out our contact form
• We typically respond within 24 hours

💬 **WhatsApp:** Available through the contact page
• Quick responses for urgent queries

📧 **Email:** Available on our contact page

For immediate help with using the platform, I can guide you right here! What do you need help with?`;
    }

    if (lowerQuestion.includes('payment') || lowerQuestion.includes('pay') || lowerQuestion.includes('charge') || lowerQuestion.includes('free')) {
      return `Good question about pricing! 💰

**LoadSaathi is FREE to use:**
• Sign up - FREE
• Post loads/trips - FREE
• Browse matches - FREE
• Chat with partners - FREE

You only pay when you successfully book a shipment or trip through the platform. We don't charge subscription fees.

The platform helps you get fair market prices through AI suggestions and transparent comparing.

Any other questions about costs or payments?`;
    }

    // Default fallback
    return `Hi! I'm Freddy, your LoadSaathi assistant. 🤝

I can help you with:
• Understanding how LoadSaathi works
• Signing up as a shipper or trucker
• Finding loads or trucks
• Estimating freight prices
• Using our calculator tools
• General questions about freight in India

What would you like to know? Feel free to ask anything!`;
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
