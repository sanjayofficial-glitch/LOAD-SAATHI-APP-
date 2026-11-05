import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  Send,
  X,
  Bot,
  Loader2,
  Clock,
  Package,
  Truck,
  Calculator,
  BookOpen,
  DollarSign,
  Phone,
  MessageCircle,
  Lightbulb,
  ChevronRight,
  Mic,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth as useAppAuth } from '@/contexts/AuthContext';
import { freddyAI } from '@/lib/freddy-ai';
import {
  askFreddyAgent,
  getOrCreateSessionId,
  classifyQuery,
  executeSearchDirect,
  searchAvailability,
  type AgentLoad,
  type AgentShipment,
  type AgentTool,
  type AgentAvailability,
  type FreddySlots,
} from '@/lib/freddyAgent';
import { speakAssistantText, cancelVoice, detectLanguage } from '@/lib/fishTts';
import { Freddy, moodToFreddyAnimation } from './FreddyAvatar';
import { useReducedMotion, useDishaKeyboard, type DishaMood } from './DishaMascot';
import { pageContextMessages } from './DishaOnboardingTips';
import { useDishaGuide } from './DishaGuideProvider';
import { PHONE_COMPACT, PHONE_E164 } from '@/config/site';

/**
 * Freddy assistant chat panel (extracted from FreddyAssistant).
 *
 * Renders the single combined panel:
 *   1. Chat — Freddy AI conversation (quick actions, typing, page context,
 *      suggested replies, message link/term formatting).
 *   2. Tips — page-aware guidance (same copy as the old Disha page tips).
 *   3. Help — WhatsApp / Call contact actions (formerly FloatingCTA).
 *
 * The component is stateless about visibility: the parent passes `open` and
 * `onOpenChange`, and owns the dismissed/restore state. `anchor` (optional)
 * lets a draggable trigger position the panel next to itself; when omitted
 * the panel stays in the default bottom-right corner.
 */

export interface FreddyChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dismissed: boolean;
  onDismiss: () => void;
  /** Top-left pixel position of a draggable trigger, if any. */
  anchor?: { x: number; y: number } | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  tool?: AgentTool;
  loads?: AgentLoad[];
  shipments?: AgentShipment[];
  strengths?: string[];
  improvements?: string[];
  tips?: string[];
  projection?: string;
  /** Quick-reply chips rendered under this assistant message. */
  options?: string[];
  /** Nearby-availability guidance shown when a strict search found nothing. */
  availability?: AgentAvailability;
  /** Step indicator for guided-form questions. */
  progress?: { current: number; total: number };
}

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  message: string;
  mood?: DishaMood;
}

interface AiResponse {
  success?: boolean;
  message?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "I'm a shipper", icon: <Package className="h-4 w-4" />, message: 'I have goods to transport. How do I get started?', mood: 'excited' },
  { label: "I'm a trucker", icon: <Truck className="h-4 w-4" />, message: 'I have a truck. How do I find loads?', mood: 'excited' },
  { label: 'Check rates', icon: <Calculator className="h-4 w-4" />, message: 'How much should I charge for freight?', mood: 'thinking' },
  { label: 'How it works', icon: <BookOpen className="h-4 w-4" />, message: 'How does LoadSaathi work?', mood: 'helpful' },
  { label: 'Pricing', icon: <DollarSign className="h-4 w-4" />, message: 'Is LoadSaathi free to use?', mood: 'helpful' },
];

const PAGE_CONTEXTS: Record<string, string> = {
  '/': 'Landing page - new user exploring the platform',
  '/features': 'Features page - interested in platform capabilities',
  '/how-it-works': 'How It Works page - learning about the platform',
  '/pricing': 'Pricing page - interested in costs',
  '/faq': 'FAQ page - has specific questions',
  '/contact': 'Contact page - looking for support',
  '/register': 'Registration page - ready to sign up',
  '/login': 'Login page - returning user',
  '/tools/fare-calculator': 'Fare Calculator tool - calculating rates',
  '/tools/freight-rate-calculator': 'Freight Rate Calculator - rate estimation',
  '/browse-trucks': 'Browse Trucks page - shipper looking for trucks',
  '/trucker/browse-shipments': 'Browse Shipments page - trucker looking for loads',
  '/shipper/post-shipment': 'Post Shipment page - creating a new shipment',
  '/trucker/post-trip': 'Post Trip page - creating a new trip',
  '/about': 'About page - learning about the company',
  '/blog': 'Blog page - reading articles',
  '/routes': 'Routes page - exploring freight routes',
};

function getPageContext(pathname: string): string {
  for (const [path, context] of Object.entries(PAGE_CONTEXTS)) {
    if (pathname === path || pathname.startsWith(path)) {
      return context;
    }
  }
  return 'General LoadSaathi inquiry';
}

type TipContext = 'public-landing' | 'shipper' | 'trucker' | 'auth' | 'admin';

function getTipContext(pathname: string): TipContext | null {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/shipper')) return 'shipper';
  if (pathname.startsWith('/trucker')) return 'trucker';
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/choose-role' ||
    pathname === '/onboarding' ||
    pathname === '/forgot-password'
  ) {
    return 'auth';
  }
  if (pathname === '/') return 'public-landing';
  return null;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const WHATSAPP_URL = `https://wa.me/${PHONE_E164.replace('+', '')}?text=${encodeURIComponent('Hi LoadSaathi, I need help with freight booking.')}`;
const TEL_URL = `tel:${PHONE_E164}`;

// ── Voice (Fish Audio free-tier TTS, browser speech fallback) ──
// speakAssistantText / cancelVoice live in src/lib/fishTts.ts: Freddy's
// replies are spoken via the /functions/v1/tts edge function (free model
// s2.1-pro-free, key kept server-side); the browser speechSynthesis is only
// a fallback when auth/network/quota blocks the primary path.

// ── Speech recognition (input mic — browser-native, no backend) ──

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results?: Array<Array<{ transcript?: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function isSpeechSupported(): boolean {
  return getSpeechRecognition() !== null;
}

// ── Slot-filling form (Freddy interviews the user like a form) ──

interface FormFlow extends FreddySlots {
  /** Index into FORM_STEPS of the question currently being asked. */
  step: number;
  /** Fields the user has already answered (incl. explicit skips). */
  answered: string[];
}

interface FormStep {
  field: keyof FreddySlots;
  question: string;
  options?: string[];
  parse: (raw: string, slots: FreddySlots) => void;
}

const FORM_STEPS: FormStep[] = [
  {
    field: 'role',
    question: 'Are you a shipper looking for a truck, or a trucker looking for loads?',
    options: ['Shipper — I need a truck', 'Trucker — I’m looking for loads'],
    parse(raw, slots) {
      const lower = raw.toLowerCase();
      const isTrucker =
        lower.includes('trucker') || lower.includes('loads') ||
        lower.includes('ट्रकर') || lower.includes('लोड');
      slots.role = isTrucker ? 'trucker' : 'shipper';
    },
  },
  {
    field: 'origin',
    question: 'Where is the shipment starting from?',
    parse(raw, slots) {
      const v = raw.trim();
      if (v) slots.origin = v;
    },
  },
  {
    field: 'destination',
    question: 'Where does it need to go?',
    parse(raw, slots) {
      const v = raw.trim();
      if (v) slots.destination = v;
    },
  },
  {
    field: 'capacity',
    question: 'How much weight/capacity do you need (in tonnes)?',
    options: ['Not sure'],
    parse(raw, slots) {
      const lower = raw.toLowerCase();
      const m = raw.match(/(\d+(?:\.\d+)?)/);
      if (m && !lower.includes('not sure') && !lower.includes('पता नहीं')) slots.capacity = Number(m[1]);
    },
  },
  {
    field: 'vehicleType',
    question: 'What type of vehicle do you prefer? (e.g. container, trailer, tipper)',
    options: ['Container', 'Trailer', 'Tipper', 'Open', 'Any'],
    parse(raw, slots) {
      const v = raw.trim();
      if (v && v.toLowerCase() !== 'any' && v.toLowerCase() !== 'कोई भी') slots.vehicleType = v;
    },
  },
  {
    field: 'budget',
    question: 'What’s your budget per tonne? (₹, e.g. 4000)',
    options: ['No limit'],
    parse(raw, slots) {
      const lower = raw.toLowerCase();
      const m = raw.match(/(\d[\d,]*)/);
      if (m && m[1] && !lower.includes('no limit') && !lower.includes('कोई सीमा नहीं')) {
        slots.budget = Number(m[1].replace(/,/g, ''));
      }
    },
  },
];

const FORM_STEPS_HI: Record<string, { question?: string; options?: string[] }> = {
  role: {
    question: 'क्या आप एक शिपर हैं जो ट्रक ढूंढ रहा है, या एक ट्रकर हैं जो लोड ढूंढ रहा है?',
    options: ['शिपर — मुझे ट्रक चाहिए', 'ट्रकर — मैं लोड ढूंढ रहा हूँ'],
  },
  origin: { question: 'शिपमेंट कहाँ से शुरू हो रही है?' },
  destination: { question: 'इसे कहाँ जाना है?' },
  capacity: { question: 'आपको कितना वज़न/क्षमता चाहिए (टन में)?', options: ['पता नहीं'] },
  vehicleType: {
    question: 'आप किस प्रकार का वाहन पसंद करते हैं? (जैसे कंटेनर, ट्रेलर, टिप्पर)',
    options: ['कंटेनर', 'ट्रेलर', 'टिप्पर', 'खुला', 'कोई भी'],
  },
  budget: { question: 'प्रति टन आपका बजट क्या है? (₹, जैसे 4000)', options: ['कोई सीमा नहीं'] },
};

function emptySlots(): FreddySlots {
  return { role: null };
}

function nextMissingStep(slots: FreddySlots, answered: string[]): number {
  return FORM_STEPS.findIndex((step) => {
    if (answered.includes(step.field)) return false;
    const value = slots[step.field];
    return value === undefined || value === null || value === '';
  });
}

function requireComposeQuery(slots: FreddySlots): string {
  const route = `${slots.origin ?? '?'} to ${slots.destination ?? '?'}`;
  const budget = slots.budget != null ? ` under ${slots.budget} per tonne` : '';
  const vehicle = slots.vehicleType ? ` (${slots.vehicleType})` : '';
  if (slots.role === 'trucker') {
    const weight = slots.capacity != null ? ` weighing at least ${slots.capacity} tonnes` : '';
    return `Find shipments from ${route}${weight}${budget}${vehicle}`;
  }
  const cap = slots.capacity != null ? ` for ${slots.capacity} tonnes` : '';
  return `Find trucks from ${route}${cap}${budget}${vehicle}`;
}

export default function FreddyChatModal({
  open,
  onOpenChange,
  dismissed,
  anchor,
}: FreddyChatModalProps) {
  const { pathname } = useLocation();
  const { getToken } = useAuth();
  const { userProfile } = useAppAuth();
  // Role-gate the UI: truckers see trucker features, shippers see shipper ones.
  const userRole = useMemo<'shipper' | 'trucker' | null>(() => {
    const t = userProfile?.user_type;
    return t === 'trucker' ? 'trucker' : t === 'shipper' ? 'shipper' : null;
  }, [userProfile]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mood, setMood] = useState<DishaMood>('idle');
  const [activeTab, setActiveTab] = useState<'chat' | 'help'>('chat');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();
  // Stable per-browser session for agent-router conversation memory.
  const [sessionId] = useState<string>(() => getOrCreateSessionId());
  // Active slot-filling form (when Freddy is interviewing the user).
  const [form, setForm] = useState<FormFlow | null>(null);

  // Voice (free, Web Speech API).
  const micSupported = isSpeechSupported();
  const [listening, setListening] = useState(false);
  const [speechPending, setSpeechPending] = useState<string | null>(null);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  // Mascot voice (TTS) toggle.
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Stop any speech when the panel unmounts.
  useEffect(() => {
    return () => cancelVoice();
  }, []);

  // Guide engine — pages feed it via useDishaGuide().handleClick etc.
  const { state: guideState, currentStep, nextStep, stop } = useDishaGuide();
  useDishaKeyboard({ disabled: !open, onEscape: () => onOpenChange(false) });

  const tipContext = getTipContext(pathname);
  const pageTip = tipContext ? pageContextMessages[tipContext]?.[0] : undefined;

  // Keep ScrollToTopFab coordinated (same event the old FloatingCTA used).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('lsaathi-fab-open', { detail: { open } }));
  }, [open]);

  // Auto-open on first visit — once per browser session, never on auth/admin
  // pages (so forms are never covered), and only when not dismissed.
  useEffect(() => {
    if (dismissed || open || messages.length > 0) return;
    if (tipContext === 'auth' || tipContext === 'admin') return;
    let seen = false;
    try {
      seen = sessionStorage.getItem('freddy-chat-autoopened') === '1';
    } catch {
      // ignore
    }
    if (seen) return;
    const timer = setTimeout(() => {
      onOpenChange(true);
      setMood('excited');
      addBotMessage(
        'Hi there! 👋 I\'m Freddy, your LoadSaathi assistant. Ask me anything about freight, trucks, or how to use LoadSaathi!'
      );
      try {
        sessionStorage.setItem('freddy-chat-autoopened', '1');
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed, open, messages.length, tipContext, onOpenChange]);

  // When a guide flow becomes active, bring up the panel so the guidance is
  // visible (the FAB also moves to the target field). When the flow ends or is
  // skipped, the FAB springs back to its default bottom-right anchor.
  useEffect(() => {
    if (!guideState?.isActive || !currentStep) return;
    if (dismissed || open) return;
    onOpenChange(true);
    if (currentStep.mood) setMood(currentStep.mood);
  }, [guideState?.isActive, currentStep, dismissed, open, onOpenChange]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const el = scrollAreaRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Per-message voice: which assistant message is currently being spoken
  // (drives the 🔊/■ toggle on each bubble).
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  // Last language the user wrote in — drives Freddy's reply/form language.
  const [uiLang, setUiLang] = useState<'en' | 'hi'>('en');

  const handleSpeakMessage = useCallback(
    (msg: ChatMessage) => {
      if (!msg.content || msg.isTyping) return;
      if (speakingMsgId === msg.id) {
        cancelVoice(); // cancel fires onEnd → clears state
        return;
      }
      setSpeakingMsgId(msg.id);
      void speakAssistantText(msg.content, getToken, {
        lang: detectLanguage(msg.content),
        onStatus: (status) => {
          if (status === 'start') {
            setMood('excited');
          } else {
            setSpeakingMsgId((cur) => (cur === msg.id ? null : cur));
            setMood('idle');
          }
        },
      });
    },
    [getToken, speakingMsgId]
  );

  const addUserMessage = useCallback((content: string) => {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const addBotMessage = useCallback((content: string, isTyping = false, extra: Partial<ChatMessage> = {}) => {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      isTyping,
      ...extra,
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const getSuggestedReply = useCallback((userMessage: string): string => {
    const lower = userMessage.toLowerCase();

    if (lower.includes('shipper') || lower.includes('goods') || lower.includes('send') || lower.includes('transport')) {
      return 'Great! As a shipper on LoadSaathi, you can post loads and find verified truckers. Would you like to know how to get started?';
    }
    if (lower.includes('truck') || lower.includes('driver') || lower.includes('earn') || lower.includes('capacity')) {
      return 'Hey there! Truckers use LoadSaathi to find loads and fill empty space. Want me to explain how it works?';
    }
    if (lower.includes('price') || lower.includes('rate') || lower.includes('cost') || lower.includes('charge') || lower.includes('fare')) {
      return 'Freight rates depend on distance, weight, vehicle type, and market demand. I can help you use our free calculators! Which route are you looking at?';
    }
    if (lower.includes('how') || lower.includes('start') || lower.includes('begin') || lower.includes('work')) {
      return 'LoadSaathi makes freight simple! Shippers post loads, truckers find them, and our AI helps match them fairly. Would you like a step-by-step guide?';
    }
    if (lower.includes('free') || lower.includes('payment') || lower.includes('pay') || lower.includes('charge') || lower.includes('cost')) {
      return 'Good news! LoadSaathi is completely free to sign up and use. You only pay for successful matches. No subscription needed!';
    }
    if (lower.includes('contact') || lower.includes('support') || lower.includes('help') || lower.includes('call') || lower.includes('phone')) {
      return 'I can help you right here! But if you need direct support, visit /contact to reach our team. What do you need help with?';
    }

    return '';
  }, []);

  const presentToolResult = useCallback(
    (data: Awaited<ReturnType<typeof askFreddyAgent>>) => {
      setIsLoading(false);

      const content =
        data.summary ||
        (data.tool === 'credit-insights'
          ? 'Here are your credit insights.'
          : 'Here are the matches:');

      addBotMessage(content, false, {
        tool: data.tool ?? undefined,
        loads: data.loads,
        shipments: data.shipments,
        strengths: data.strengths,
        improvements: data.improvements,
        tips: data.tips,
        projection: data.projection,
      });

      const hasResults =
        (data.loads && data.loads.length > 0) ||
        (data.shipments && data.shipments.length > 0);
      setMood(data.tool === 'credit-insights' || hasResults ? 'celebrate' : 'helpful');
    },
    [addBotMessage]
  );

  /** Run a completed search: try the agent-router, fall back to a direct DB read. */
  const executeSearchFromSlots = useCallback(
    async (slots: FreddySlots) => {
      setForm(null);
      setIsLoading(true);
      setMood('thinking');
      addBotMessage('', true);

      const query = requireComposeQuery(slots);
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      try {
        const data = await askFreddyAgent({ message: query, sessionId, history, getToken });
        setMessages((prev) => prev.filter((m) => !m.isTyping));
        if (data.enabled !== false && data.tool) {
          presentToolResult(data);
          return;
        }
        // fall through to direct search (disabled or no tool)
      } catch {
        // fall through to direct search
      }

      try {
        const data = await executeSearchDirect(slots, getToken);
        setMessages((prev) => prev.filter((m) => !m.isTyping));

        const hasResults =
          (data.loads && data.loads.length > 0) ||
          (data.shipments && data.shipments.length > 0);

        if (hasResults) {
          presentToolResult(data);
          return;
        }

        // Zero results → guide the user instead of leaving them at a dead end.
        const noun = slots.role === 'trucker' ? 'open shipments' : 'open trucks';
        let availability: AgentAvailability | undefined;
        try {
          const avail = await searchAvailability(slots, getToken);
          availability = avail.suggestions.length > 0 ? avail : undefined;
        } catch {
          availability = undefined;
        }
        addBotMessage(
          `No ${noun} found matching your search. Here’s what was available nearby:`,
          false,
          availability ? { availability } : {}
        );
        setMood('idle');
      } catch {
        setMessages((prev) => prev.filter((m) => !m.isTyping));
        addBotMessage(
          "I couldn't reach the search service right now. Please try again shortly.",
          false
        );
        setMood('confused');
      } finally {
        setIsLoading(false);
        setTimeout(() => setMood('idle'), 2000);
      }
    },
    [addBotMessage, getToken, messages, presentToolResult, sessionId]
  );

  const askFormQuestion = useCallback(
    (slots: FreddySlots, answered: string[]) => {
      const idx = nextMissingStep(slots, answered);
      if (idx === -1) {
        // Form complete → run the search now.
        setForm(null);
        void executeSearchFromSlots(slots);
        return;
      }
      const step = FORM_STEPS[idx];
      if (!step) {
        setForm(null);
        return;
      }
      // Show the question in the user's language (Hindi when they type Hindi).
      const hiStep = FORM_STEPS_HI[step.field];
      const question = uiLang === 'hi' && hiStep?.question ? hiStep.question : step.question;
      const options = uiLang === 'hi' && hiStep?.options ? hiStep.options : step.options;
      setForm({ ...slots, step: idx, answered });
      addBotMessage(question, false, {
        progress: { current: idx + 1, total: FORM_STEPS.length },
        ...(options ? { options } : {}),
      });
      if (voiceEnabled && !reducedMotion) void speakAssistantText(question, getToken, { lang: uiLang });
    },
    [addBotMessage, executeSearchFromSlots, voiceEnabled, reducedMotion, getToken, uiLang]
  );

  const beginForm = useCallback(
    (slots: Partial<FreddySlots>) => {
      const merged = emptySlots();
      merged.role = slots.role ?? null;
      if (slots.origin) merged.origin = slots.origin;
      if (slots.destination) merged.destination = slots.destination;
      if (slots.capacity != null) merged.capacity = slots.capacity;
      if (slots.budget != null) merged.budget = slots.budget;
      if (slots.vehicleType) merged.vehicleType = slots.vehicleType;
      const answered = FORM_STEPS.filter((step) => {
        const v = merged[step.field];
        return v !== undefined && v !== null && v !== '';
      }).map((step) => step.field);
      askFormQuestion(merged, answered);
    },
    [askFormQuestion]
  );

  const sendText = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || isLoading) return;

      // Match Freddy's language to what the user just wrote.
      const replyLang = detectLanguage(message);
      setUiLang(replyLang);

      // Active form → this message is the answer to the current question.
      if (form) {
        setInputValue('');
        addUserMessage(message);
        const step = FORM_STEPS[form.step];
        if (!step) {
          setForm(null);
          return;
        }
        const next: FreddySlots = { ...form };
        step.parse(message, next);
        const answered = form.answered.includes(step.field)
          ? form.answered
          : [...form.answered, step.field];
        askFormQuestion(next, answered);
        return;
      }

      setInputValue('');
      setIsLoading(true);
      setMood('thinking');
      addUserMessage(message);
      addBotMessage('', true);

      // ── Agent path: Freddy copilot (tool calling via agent-router) ──
      try {
        const history = messages.map((m) => ({ role: m.role, content: m.content }));
        const data = await askFreddyAgent({ message, sessionId, history, getToken, lang: replyLang });

        setMessages((prev) => prev.filter((m) => !m.isTyping));

        // Kill switch / disabled state: backend reports enabled:false.
        if (data.enabled === false) {
          setIsLoading(false);
          addBotMessage(
            'Freddy is temporarily unavailable. Please try again later, or use the browse filters on the marketplace pages.',
            false
          );
          setMood('idle');
          return;
        }

        // No tool executed → if this looks like a search request, start the
        // slot-filling form instead of showing a generic "no filters" message.
        if (!data.tool && data.detail) {
          const { intent, slots } = classifyQuery(message);
          if (intent) {
            if (!slots.role && userRole) slots.role = userRole;
            setIsLoading(false);
            beginForm(slots);
            return;
          }
          setIsLoading(false);
          addBotMessage(data.detail, false);
          setMood('idle');
          return;
        }

        if (data.tool) {
          presentToolResult(data);
          return;
        }
      } catch {
        // agent-router unavailable / not authenticated / network error → fall
        // through to direct search or the knowledge path below.
      }

      // ── Search intent without a working agent → interview, then search directly ──
      const { intent, slots } = classifyQuery(message);
      if (intent) {
        if (!slots.role && userRole) slots.role = userRole;
        setMessages((prev) => prev.filter((m) => !m.isTyping));
        if (slots.role && slots.origin && slots.destination) {
          await executeSearchFromSlots(slots as FreddySlots);
          return;
        }
        setIsLoading(false);
        beginForm(slots);
        return;
      }

      // ── Fallback path: free LLM knowledge answers ──
      try {
        const pageContext = typeof window !== 'undefined' ? getPageContext(window.location.pathname) : 'General inquiry';

        const response = (await freddyAI.ask(message, pageContext, replyLang)) as AiResponse;

        setMessages((prev) => prev.filter((m) => !m.isTyping));

        if (response.success) {
          addBotMessage(response.message ?? '');
          setMood('helpful');

          const suggestedReply = getSuggestedReply(message);
          if (suggestedReply && !(response.message ?? '').includes(suggestedReply)) {
            setTimeout(() => {
              addBotMessage(suggestedReply, false);
              setMood('idle');
            }, 1500);
          }
        } else {
          addBotMessage(
            "I'm having trouble connecting right now. But I can still help! Try asking about LoadSaathi features, pricing, or how to get started. You can also visit /contact for direct support.",
            false
          );
          setMood('confused');
        }
      } catch {
        setMessages((prev) => prev.filter((m) => !m.isTyping));
        addBotMessage(
          'I encountered an error. Please try again or visit /contact for help. In the meantime, feel free to ask me about LoadSaathi!',
          false
        );
        setMood('confused');
      } finally {
        setIsLoading(false);
        setTimeout(() => setMood('idle'), 2000);
      }
    },
    [
      form,
      isLoading,
      messages,
      sessionId,
      getToken,
      userRole,
      addUserMessage,
      addBotMessage,
      getSuggestedReply,
      askFormQuestion,
      beginForm,
      presentToolResult,
      executeSearchFromSlots,
    ]
  );

  const handleSend = useCallback(() => {
    void sendText(inputValue);
  }, [inputValue, sendText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      setMood(action.mood || 'thinking');
      void sendText(action.message);
    },
    [sendText]
  );

  const handleLinkClick = useCallback((path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  }, []);

  /** Zero-typing home sheet — role-aware action cards, no blank input. */
  const renderHome = useCallback(() => {
    const isShipper = userRole === 'shipper';
    const isTrucker = userRole === 'trucker';

    const actions = [
      ...(isTrucker
        ? []
        : [
            {
              key: 'find-truck',
              label: 'Find a truck',
              hint: isShipper ? 'For your goods' : 'As a shipper',
              icon: <Truck className="h-5 w-5" />,
              run: () => beginForm({ role: 'shipper' }),
            },
          ]),
      ...(isShipper
        ? []
        : [
            {
              key: 'find-load',
              label: 'Find a load',
              hint: isTrucker ? 'Loads for your truck' : 'As a trucker',
              icon: <Package className="h-5 w-5" />,
              run: () => beginForm({ role: 'trucker' }),
            },
          ]),
      ...(isTrucker
        ? [
            {
              key: 'post-trip',
              label: 'Post my trip',
              hint: 'Share your route',
              icon: <Truck className="h-5 w-5" />,
              run: () => handleLinkClick('/trucker/post-trip'),
            },
          ]
        : []),
      ...(isShipper
        ? [
            {
              key: 'post-load',
              label: 'Post my load',
              hint: 'Ship your goods',
              icon: <Package className="h-5 w-5" />,
              run: () => handleLinkClick('/shipper/post-shipment'),
            },
          ]
        : []),
      {
        key: 'rates',
        label: 'Check rates',
        hint: 'Freight pricing',
        icon: <Calculator className="h-5 w-5" />,
        run: () => void sendText('How much should I charge for freight?'),
      },
      {
        key: 'credit',
        label: 'My credit score',
        hint: 'Trust & insights',
        icon: <DollarSign className="h-5 w-5" />,
        run: () => void sendText('What is my credit score?'),
      },
    ];

    const greeting = isTrucker
      ? 'Hi, I’m Freddy 👋 — ready to find you loads.'
      : isShipper
        ? 'Hi, I’m Freddy 👋 — ready to move your goods.'
        : 'Hi, I’m Freddy 👋';

    return (
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 flex-shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
            <Freddy animation={moodToFreddyAnimation[mood]} size={44} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{greeting}</p>
            <p className="text-xs text-muted-foreground">Tap an option — no typing needed.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.run}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-left transition-colors hover:border-orange-400"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300">
                {action.icon}
              </span>
              <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">{action.label}</span>
              <span className="block text-[11px] text-muted-foreground">{action.hint}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {micSupported
            ? 'Prefer chatting? Type below — or tap the mic 🎤 to speak.'
            : 'Prefer chatting? Type below — your voice is supported on Chrome/Android.'}
        </p>
      </div>
    );
  }, [beginForm, handleLinkClick, micSupported, mood, sendText, userRole]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setMood('idle');
    cancelVoice();
  }, [onOpenChange]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    try {
      const recognition = new Ctor();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (e) => {
        const transcript = e.results?.[0]?.[0]?.transcript ?? '';
        if (transcript.trim()) setSpeechPending(transcript.trim());
      };
      recognition.onerror = () => stopListening();
      recognition.onend = () => stopListening();
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
      setMood('listening');
    } catch {
      setListening(false);
    }
  }, [stopListening]);

  const renderMessageContent = useCallback(
    (content: string, role: 'user' | 'assistant') => {
      const parts = content.split(/(:\/\/[^\s]+|\/[a-zA-Z0-9/-]+)/g);

      return parts.map((part, index) => {
        const linkMatch = part.match(/^(\/[a-zA-Z0-9/-]+)$/);
        if (linkMatch && role === 'assistant') {
          return (
            <button
              key={index}
              onClick={() => handleLinkClick(part)}
              className={cn(
                'inline-block text-orange-600 dark:text-orange-400 hover:underline font-medium transition-colors',
                reducedMotion ? '' : 'hover:scale-105'
              )}
            >
              {part}
            </button>
          );
        }
        const highlighted = part.replace(
          /(\b(?:shipper|trucker|freight|load|trip|price|rate|calculator|register|login|dashboard|browse|post|track)\b)/gi,
          '<strong class="text-orange-600 dark:text-orange-400">$1</strong>'
        );
        return (
          <span key={index} dangerouslySetInnerHTML={{ __html: highlighted }} className="leading-relaxed" />
        );
      });
    },
    [handleLinkClick, reducedMotion]
  );

  const renderToolResults = useCallback(
    (msg: ChatMessage) => {
      if (msg.tool === 'search_market' && msg.loads && msg.loads.length > 0) {
        return (
          <div className="mt-2 space-y-2">
            {msg.loads.map((load) => (
              <div
                key={load.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {load.origin_city} → {load.destination_city}
                  </span>
                  {load.trucker?.is_verified && (
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {load.departure_date && <span>📅 {load.departure_date}</span>}
                  {load.available_capacity_tonnes != null && (
                    <span>⚖️ {load.available_capacity_tonnes}t</span>
                  )}
                  {load.price_per_tonne != null && (
                    <span>💰 ₹{load.price_per_tonne}/tonne</span>
                  )}
                  {load.vehicle_type && <span>🚛 {load.vehicle_type}</span>}
                </div>
                {load.trucker?.full_name && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    by {load.trucker.full_name}
                    {typeof load.trucker.rating === 'number' && (
                      <span> · ★ {load.trucker.rating.toFixed(1)}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleLinkClick('/browse-trucks')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 transition-colors"
            >
              View all available trucks →
            </button>
          </div>
        );
      }

      if (msg.tool === 'search_shipments' && msg.shipments && msg.shipments.length > 0) {
        return (
          <div className="mt-2 space-y-2">
            {msg.shipments.map((shipment) => (
              <div
                key={shipment.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {shipment.origin_city} → {shipment.destination_city}
                  </span>
                  {shipment.shipper?.is_verified && (
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {shipment.departure_date && <span>📅 {shipment.departure_date}</span>}
                  {shipment.weight_tonnes != null && (
                    <span>⚖️ {shipment.weight_tonnes}t</span>
                  )}
                  {shipment.budget_per_tonne != null && (
                    <span>💰 ₹{shipment.budget_per_tonne}/tonne</span>
                  )}
                  {shipment.goods_description && <span>📦 {shipment.goods_description}</span>}
                </div>
                {shipment.shipper?.full_name && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    by {shipment.shipper.full_name}
                    {typeof shipment.shipper.rating === 'number' && (
                      <span> · ★ {shipment.shipper.rating.toFixed(1)}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleLinkClick('/trucker/browse-shipments')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 transition-colors"
            >
              View all open shipments →
            </button>
          </div>
        );
      }

      if (msg.tool === 'credit-insights') {
        const hasInsights =
          (msg.strengths && msg.strengths.length > 0) ||
          (msg.improvements && msg.improvements.length > 0) ||
          (msg.tips && msg.tips.length > 0) ||
          Boolean(msg.projection);
        if (!hasInsights) return null;
        return (
          <div className="mt-2 space-y-2">
            {msg.strengths && msg.strengths.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                  Strengths
                </p>
                <div className="space-y-1">
                  {msg.strengths.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-green-50 dark:bg-green-900/20 px-2.5 py-1.5 text-xs text-green-800 dark:text-green-200"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {msg.improvements && msg.improvements.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  To improve
                </p>
                <div className="space-y-1">
                  {msg.improvements.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 text-xs text-amber-800 dark:text-amber-200"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {msg.tips && msg.tips.length > 0 && (
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  Tips
                </p>
                <div className="space-y-1">
                  {msg.tips.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 text-xs text-blue-800 dark:text-blue-200"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {msg.projection && (
              <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300">
                📈 Projection: {msg.projection}
              </div>
            )}
          </div>
        );
      }

      return null;
    },
    [handleLinkClick]
  );

  const renderAvailability = useCallback(
    (msg: ChatMessage) => {
      if (!msg.availability || msg.availability.suggestions.length === 0) return null;
      const role = msg.availability.role;
      const ctaPath = role === 'trucker' ? '/trucker/post-trip' : '/shipper/post-shipment';
      const ctaLabel =
        role === 'trucker'
          ? 'Post your trip — shippers will find you'
          : 'Post your load — truckers will come to you';
      return (
        <div className="mt-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/60 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Nearby availability
          </p>
          <div className="mt-1.5 space-y-1.5">
            {msg.availability.suggestions.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => void executeSearchFromSlots(s.slots)}
                className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-2 text-xs transition-colors hover:border-orange-400"
              >
                <span className="block font-medium text-gray-800 dark:text-gray-100">{s.label}</span>
                <span className="text-orange-600 dark:text-orange-400 font-semibold">Search now →</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleLinkClick(ctaPath)}
              className="w-full text-left rounded-lg border border-dashed border-orange-300 dark:border-orange-800 px-2.5 py-2 text-xs font-medium text-orange-700 dark:text-orange-300 transition-colors hover:bg-orange-50 dark:hover:bg-orange-950/40"
            >
              {ctaLabel} →
            </button>
          </div>
        </div>
      );
    },
    [executeSearchFromSlots, handleLinkClick]
  );

  // Panel geometry — the morph travels from the pill's actual position to an
  // adjacent spot (above the pill when there's room, otherwise below it).
  // This keeps the expansion attached to the trigger instead of jumping to
  // the top of the viewport.
  const PILL_W = 151;
  const PILL_H = 56;
  const EDGE = 8;
  const GAP = 12;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

  // Responsive panel size — never covers the whole screen on any phone.
  const isMobile = vw < 480;
  // Phones: compact centered bottom sheet — width ≈ 72% of the viewport,
  // height ≈ 60%, so the dashboard stays clearly visible on every side.
  const PANEL_W = isMobile
    ? Math.max(260, Math.min(340, Math.round(vw * 0.72)))
    : Math.min(380, vw - 24);
  const PANEL_H = isMobile
    ? Math.max(360, Math.min(540, Math.round(vh * 0.6)))
    : Math.max(380, Math.min(600, vh - 140));

  const pillRect = {
    left: anchor ? anchor.x : vw - 16 - PILL_W,
    top: anchor ? anchor.y : vh - 96 - PILL_H,
  };

  const panelRect = (() => {
    if (!anchor) {
      if (isMobile) {
        return {
          left: Math.max(8, Math.round((vw - PANEL_W) / 2)),
          top: Math.max(8, vh - PANEL_H - 12),
        };
      }
      return { left: vw - 16 - PANEL_W, top: vh - 96 - PANEL_H };
    }
    const left = Math.min(
      Math.max(anchor.x + PILL_W - PANEL_W + 4, EDGE),
      Math.max(EDGE, vw - PANEL_W - EDGE)
    );
    const spaceAbove = anchor.y - EDGE;
    let top: number;
    if (spaceAbove >= PANEL_H + GAP) {
      top = anchor.y - PANEL_H - GAP;
    } else {
      top = Math.min(anchor.y + PILL_H + GAP, Math.max(EDGE, vh - PANEL_H - EDGE));
    }
    return { left, top };
  })();

  return (
    <motion.div
      className={cn(
        'fixed z-[100] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-180px)] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden flex flex-col'
      )}
      style={{
        left: panelRect.left,
        top: panelRect.top,
        ...(reducedMotion ? { width: PANEL_W, height: PANEL_H } : {}),
      }}
      initial={false}
      animate={
        reducedMotion
          ? {}
          : {
              left: open ? panelRect.left : pillRect.left,
              top: open ? panelRect.top : pillRect.top,
              width: open ? PANEL_W : PILL_W,
              height: open ? PANEL_H : PILL_H,
              borderRadius: open ? 16 : '9999px',
              opacity: open ? 1 : 0,
              pointerEvents: open ? 'auto' : 'none',
            }
      }
      transition={{
        left: { type: 'spring', stiffness: 260, damping: 30 },
        top: { type: 'spring', stiffness: 260, damping: 30 },
        width: { type: 'spring', stiffness: 250, damping: 30 },
        height: { type: 'spring', stiffness: 250, damping: 30 },
        borderRadius: { type: 'spring', stiffness: 250, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      onMouseEnter={() => !reducedMotion && setMood('excited')}
      onMouseLeave={() => setMood('idle')}
    >
      {/* Inner content fades in after the shape morphs, so the expansion feels smooth */}
      <motion.div
        className="flex flex-1 min-h-0 flex-col"
        initial={false}
        animate={{ opacity: reducedMotion || open ? 1 : 0 }}
        transition={{ opacity: { duration: 0.3, delay: open && !reducedMotion ? 0.14 : 0 } }}
      >
      {/* Slim header — mini avatar + speaker + exit (no bulky title bar) */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-orange-200 dark:border-orange-800">
        <div className="grid h-8 w-8 flex-shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
          <Freddy animation={moodToFreddyAnimation[mood]} size={30} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">Ask Freddy</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setVoiceEnabled((v) => {
              const next = !v;
              if (!next) cancelVoice();
              return next;
            });
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
          aria-label={voiceEnabled ? 'Mute Freddy voice' : 'Enable Freddy voice'}
          title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
        >
          {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Guide step banner (active flow → interactive) else page tip */}
      {guideState?.isActive && currentStep ? (
        <div className="px-4 py-2 border-b border-orange-100 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/30">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-800 dark:text-orange-200 leading-snug">{currentStep.message}</p>
          </div>
          <div className="flex gap-3 items-center mt-1.5">
            <button
              type="button"
              onClick={stop}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip Guidance
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="ml-auto text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      ) : pageTip ? (
        <div className="px-4 py-2 flex items-start gap-2 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-100 dark:border-orange-900/40">
          <Lightbulb className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-800 dark:text-orange-200 leading-snug">{pageTip.message}</p>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors',
            activeTab === 'chat'
              ? 'text-orange-600 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          <Bot className="h-3.5 w-3.5" /> Chat
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('help')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors',
            activeTab === 'help'
              ? 'text-orange-600 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          <Phone className="h-3.5 w-3.5" /> Help
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {activeTab === 'chat' ? (
          <>
            {/* Quick actions */}
            {messages.length <= 1 && !isLoading && (
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => handleQuickAction(action)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800/40"
                    >
                      {action.icon}
                      <span className="hidden sm:inline">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages / Home */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 overflow-y-auto">
              {messages.length === 0 && !form && !isLoading ? (
                renderHome()
              ) : (
                <div className="p-3 sm:p-4 space-y-3">
                  {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={reducedMotion ? {} : { opacity: 0, y: 10, scale: 0.95 }}
                    animate={reducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-2.5',
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <Bot className="h-3.5 w-3.5 text-orange-500" />
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                            Freddy
                          </span>
                          {!message.isTyping && message.content && (
                            <button
                              type="button"
                              onClick={() => handleSpeakMessage(message)}
                              aria-label={speakingMsgId === message.id ? 'Stop voice' : 'Play this reply'}
                              title={speakingMsgId === message.id ? 'Stop' : 'Listen'}
                              className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-orange-600 transition-colors"
                            >
                              {speakingMsgId === message.id ? (
                                <Square className="h-3 w-3" />
                              ) : (
                                <Volume2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                      {message.progress && (
                        <div className="mb-2">
                          <div className="mb-1 flex justify-between text-[10px] font-medium text-muted-foreground">
                            <span>Step {message.progress.current} of {message.progress.total}</span>
                            <span>Tap an option or speak 🎤</span>
                          </div>
                          <div className="h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-full bg-orange-500 transition-all"
                              style={{ width: `${(message.progress.current / message.progress.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="text-sm leading-relaxed">
                        {message.isTyping ? (
                          <div className="flex items-center gap-1 py-1">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Thinking...</span>
                          </div>
                        ) : (
                          renderMessageContent(message.content, message.role)
                        )}
                      </div>
                      {renderToolResults(message)}
                      {renderAvailability(message)}
                      {message.options && message.options.length > 0 && (
                        <div className={cn('mt-2 flex gap-1.5', message.progress ? 'flex-col' : 'flex-wrap')}>
                          {message.options.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => void sendText(option)}
                              className={cn(
                                'font-medium transition-colors',
                                message.progress
                                  ? 'w-full text-left rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-sm text-orange-700 hover:bg-orange-100 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-900/40'
                                  : 'rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-orange-700 hover:bg-orange-100 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-900/40'
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                      <div
                        className={cn(
                          'flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground',
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(message.timestamp)}</span>
                      </div>
                    </div>
                  </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Speech confirmation (free Web Speech API) */}
            {speechPending && (
              <div className="border-t border-orange-200 bg-orange-50/70 px-4 py-2.5 dark:border-orange-800 dark:bg-orange-950/30">
                <p className="text-[11px] font-medium text-orange-700 dark:text-orange-300">I heard:</p>
                <p className="my-1 text-sm text-gray-800 dark:text-gray-200">“{speechPending}”</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const spoken = speechPending;
                      setSpeechPending(null);
                      void sendText(spoken);
                    }}
                  >
                    ✓ Confirm
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSpeechPending(null);
                      startListening();
                    }}
                  >
                    ↻ Listen again
                  </Button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-orange-200 dark:border-orange-800">
              <Input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={micSupported ? 'Ask, type, or tap the mic…' : 'Ask Freddy anything…'}
                disabled={isLoading}
                className="flex-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm py-2"
              />
              {micSupported && !speechPending && (
                <Button
                  type="button"
                  variant={listening ? 'default' : 'outline'}
                  aria-label={listening ? 'Stop listening' : 'Speak your answer'}
                  onClick={listening ? stopListening : startListening}
                  className={cn(
                    'h-10 w-10 p-0 shrink-0',
                    listening && 'bg-red-500 hover:bg-red-600 border-red-500 text-white'
                  )}
                >
                  {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Button
                type="button"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={cn(
                  'h-10 w-10 p-0',
                  !inputValue.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : ''
                )}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        ) : (
          /* Help tab */
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Prefer to talk to a human? Reach our team directly.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white">WhatsApp</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Chat with a freight expert</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </a>
            <a
              href={TEL_URL}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Call Now</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{PHONE_COMPACT}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </a>
            <button
              type="button"
              onClick={() => handleLinkClick('/contact')}
              className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Visit the contact page →
            </button>
          </div>
        )}
      </div>

      {/* Footer hint — hidden on phones to save vertical space */}
      <div className="hidden min-[480px]:block px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
        <p className="text-[10px] text-muted-foreground text-center">
          Powered by AI • Free to use • 🎯 LoadSaathi
        </p>
      </div>
      </motion.div>
    </motion.div>
  );
}
