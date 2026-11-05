// Freddy AI Service - Uses free LLM APIs to answer user questions
// Supports multiple free providers with fallback

// Available free LLM providers (in order of preference)
const PROVIDERS = {
  // HuggingFace Inference API - free tier available
  huggingface: {
    name: 'HuggingFace',
    baseUrl: 'https://api-inference.huggingface.co/models',
    // Models that work well for chat
    models: [
      'microsoft/DialoGPT-medium',
      'google/flan-t5-large',
      'facebook/blenderbot-400M-distill',
    ],
    headers: (token: string) => ({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
  },
  // Groq - free tier with fast inference
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      'llama-3.1-8b-instant',
      'llama-3.2-3b-preview',
      'mixtral-8x7b-32768',
    ],
    headers: (token: string) => ({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
  },
};

// Knowledge base about LoadSaathi - used for RAG-style responses
const LOADSAATHI_KNOWLEDGE = `
LOADSAATHI - Precision Freight Intelligence Platform
=====================================================

WHAT IS LOADSAATHI:
LoadSaathi is an AI-powered freight marketplace connecting shippers with truckers in India.
- Shippers can post loads and find verified truckers
- Truckers can post trips and find loads to fill empty space
- AI-powered matching and price suggestions
- Real-time GPS tracking for fleet management

FOR SHIPPERS (have goods to transport):
- Post shipments with origin, destination, weight, timeline
- Browse available trucks on your route
- Compare rates and choose the best option
- Track shipments in real-time
- Build credit score for better matches
- Get AI-suggested fair prices

FOR TRUCKERS (have truck space):
- Post trips with route and capacity
- Browse available loads matching your route
- Track earnings and trips
- Build reputation through ratings
- Get AI-suggested market rates
- Real-time GPS tracking for transparency

KEY FEATURES:
- AI-powered price prediction and suggestions
- Smart matching algorithm (7-factor scoring)
- Real-time GPS tracking
- Credit score system for trust
- Direct chat between shippers and truckers
- Document checklist for compliance
- Multiple calculator tools (freight rate, PTL/FTL, return load, etc.)

PRICING:
- Free to sign up and post loads/trips
- Pay per successful match/transaction
- No subscription required for basic features

SUPPORTED REGIONS:
- Primarily East India (Odisha, Jharkhand, West Bengal, Bihar)
- Expanding to pan-India coverage
- Major routes include Rourkela-Ranchi, Kolkata-Delhi, etc.

TRANSPORT TYPES:
- PTL (Partial Truck Load) - for smaller shipments
- FTL (Full Truck Load) - for full truck capacity
- LTL (Less than Truck Load) - for very small shipments

HOW IT WORKS:
1. Sign up as shipper or trucker
2. Post your load/trip with details
3. AI matches you with suitable partners
4. Chat and coordinate directly
5. Track the shipment/trip in real-time
6. Rate and review after completion

TOOLS AVAILABLE:
- Fare Calculator
- Freight Rate Calculator
- Return Load Calculator
- Truck Load Calculator
- PTL vs FTL Calculator
- Route Optimizer
- Trip Profit Calculator
- Carbon Savings Calculator
- GST Calculator
- And many more...

CONTACT:
- Website: loadsaathi.in
- Email available through contact page
- WhatsApp support available
`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  success: boolean;
  message: string;
  providerUsed?: string;
  error?: string;
}

class FreddyAI {
  private hfToken: string | null = null;
  private groqToken: string | null = null;

  constructor() {
    // Load tokens from environment (will be defined at build time)
    this.hfToken = typeof window !== 'undefined' 
      ? localStorage.getItem('freddy_hf_token') 
      : null;
    this.groqToken = typeof window !== 'undefined'
      ? localStorage.getItem('freddy_groq_token')
      : null;
  }

  setTokens(hfToken?: string, groqToken?: string) {
    if (hfToken) {
      this.hfToken = hfToken;
      localStorage.setItem('freddy_hf_token', hfToken);
    }
    if (groqToken) {
      this.groqToken = groqToken;
      localStorage.setItem('freddy_groq_token', groqToken);
    }
  }

  async ask(question: string, context?: string, lang: "en" | "hi" = "en"): Promise<AIResponse> {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.getSystemPrompt(lang) },
      { role: 'user', content: this.formatUserQuestion(question, context, lang) },
    ];

    // Try each provider in order
    const providers = [
      { key: 'groq', config: PROVIDERS.groq, token: this.groqToken },
      { key: 'huggingface', config: PROVIDERS.huggingface, token: this.hfToken },
    ];

    for (const provider of providers) {
      if (!provider.token) continue;

      try {
        const response = await this.callProvider(provider.key, provider.config, provider.token, messages);
        if (response.success) {
          return {
            success: true,
            message: response.message,
            providerUsed: provider.config.name,
          };
        }
      } catch (error) {
        console.warn(`[FreddyAI] ${provider.config.name} failed:`, error);
        continue;
      }
    }

    // Fallback to knowledge-based response if all APIs fail
    return {
      success: true,
      message: this.knowledgeBasedResponse(question),
      providerUsed: 'knowledge-base',
    };
  }

  private async callProvider(
    providerKey: string,
    config: typeof PROVIDERS.groq,
    token: string,
    messages: ChatMessage[]
  ): Promise<AIResponse> {
    const model = config.models[0]; // Use first available model
    if (!model) {
      return { success: false, message: 'No model configured for this provider', error: 'no_model' };
    }

    if (providerKey === 'groq') {
      return this.callGroq(config, token, model, messages);
    } else if (providerKey === 'huggingface') {
      return this.callHuggingFace(config, token, model, messages);
    }

    return { success: false, message: 'Unknown provider', error: 'Invalid provider' };
  }

  private async callGroq(
    config: typeof PROVIDERS.groq,
    token: string,
    model: string,
    messages: ChatMessage[]
  ): Promise<AIResponse> {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: config.headers(token),
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: 'API error',
        error: `Groq error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return {
        success: true,
        message: data.choices[0].message.content,
      };
    }

    return {
      success: false,
      message: 'No response',
      error: 'Empty response from Groq',
    };
  }

  private async callHuggingFace(
    config: typeof PROVIDERS.huggingface,
    token: string,
    model: string,
    messages: ChatMessage[]
  ): Promise<AIResponse> {
    // HuggingFace uses a different format - convert messages to text
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    
    const response = await fetch(`${config.baseUrl}/${model}`, {
      method: 'POST',
      headers: config.headers(token),
      body: JSON.stringify({
        inputs: userMessage,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 503) {
        // Model is loading, return fallback
        return {
          success: false,
          message: 'Model loading',
          error: 'Model is loading, please try again',
        };
      }
      const errorText = await response.text();
      return {
        success: false,
        message: 'API error',
        error: `HuggingFace error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    
    if (data.generated_text) {
      return {
        success: true,
        message: data.generated_text,
      };
    }

    return {
      success: false,
      message: 'No response',
      error: 'Empty response from HuggingFace',
    };
  }

  private getSystemPrompt(lang: "en" | "hi" = "en"): string {
    const languageRule = lang === "hi"
      ? `- REPLY IN HINDI (Devanagari script). Use simple, friendly Hindi. Keep any page links and numbers as-is.`
      : `- REPLY IN ENGLISH. Use simple, friendly English.`;
    return `You are Freddy, the friendly AI assistant for LoadSaathi, an Indian freight marketplace platform.

YOUR ROLE:
- Help users understand LoadSaathi's services
- Guide users on how to use the platform
- Answer questions about freight, truck booking, and logistics in India
- Be friendly, helpful, and professional
- Use simple Hindi/English mix if the user seems more comfortable with that
- ALWAYS include relevant links to pages when helping users take action

LANGUAGE RULE:
${languageRule}

IMPORTANT GUIDELINES:
1. Keep responses concise and actionable
2. When users ask about specific features, guide them to the right page
3. For pricing questions, mention that basic features are free
4. For signup questions, encourage them to register (it's free)
5. If you don't know something, be honest and suggest contacting support
6. Always be encouraging - freight can be complex for new users

KEY PAGES TO REFERENCE:
- /register - Sign up (free)
- /login - Sign in
- /features - Platform features
- /how-it-works - Step by step guide
- /tools/fare-calculator - Calculate freight rates
- /browse-trucks - Find trucks (for shippers)
- /trucker/browse-shipments - Find loads (for truckers)
- /contact - Contact support
- /faq - Frequently asked questions
- /pricing - Pricing information

LoadSaathi is FREE to use for basic features. Users only pay for successful matches/transactions.`;
  }

  private formatUserQuestion(question: string, context?: string, lang: "en" | "hi" = "en"): string {
    let formatted = `Context: ${LOADSAATHI_KNOWLEDGE}\n\n`;
    
    if (context) {
      formatted += `Current Page Context: ${context}\n\n`;
    }
    
    formatted += `User Question: ${question}\n\n`;
    formatted += lang === "hi"
      ? `Please provide a helpful, concise answer IN HINDI (Devanagari script). Include relevant page links if appropriate. Use friendly language suitable for Indian users.`
      : `Please provide a helpful, concise answer IN ENGLISH. Include relevant page links if appropriate. Use friendly language suitable for Indian users.`;
    
    return formatted;
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

// Initialize with tokens from environment if available
if (typeof window !== 'undefined') {
  const initTokens = () => {
    const hfToken = import.meta.env.VITE_HUGGINGFACE_TOKEN;
    const groqToken = import.meta.env.VITE_GROQ_API_KEY;
    if (hfToken || groqToken) {
      freddyAI.setTokens(hfToken || undefined, groqToken || undefined);
    }
  };
  initTokens();
}
