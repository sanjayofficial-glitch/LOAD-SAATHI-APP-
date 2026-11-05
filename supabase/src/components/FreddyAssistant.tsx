import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { freddyAI } from '@/lib/freddy-ai';
import { Freddy, moodToFreddyAnimation } from './FreddyAvatar';
import { useReducedMotion, useDishaKeyboard, type DishaMood } from './DishaMascot';
import { pageContextMessages } from './DishaOnboardingTips';
import { useDishaGuide } from './DishaGuideProvider';
import { PHONE_COMPACT, PHONE_E164 } from '@/config/site';

/**
 * Unified Freddy assistant.
 *
 * One floating trigger (bottom-right) that shows the Freddy avatar and opens a
 * single panel combining:
 *   1. Chat — Freddy AI conversation (quick actions, typing, page context,
 *      suggested replies, message link/term formatting).
 *   2. Tips — page-aware guidance (same copy as the old Disha page tips).
 *   3. Help — WhatsApp / Call contact actions (formerly FloatingCTA).
 *
 * Replaces the separate Disha mascot (bottom-left), FreddyChat FAB and the
 * Get-Help FAB. Dismissal is persisted in localStorage; a small restore chip
 * is offered so dismissal is never a permanent soft-lock.
 */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
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

export default function FreddyAssistant() {
  const { pathname } = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mood, setMood] = useState<DishaMood>('idle');
  const [activeTab, setActiveTab] = useState<'chat' | 'help'>('chat');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();

  // Guide engine — pages feed it via useDishaGuide().handleClick etc.
  const { state: guideState, currentStep, targetPosition, nextStep, stop } = useDishaGuide();
  useDishaKeyboard({ disabled: !isOpen, onEscape: () => setIsOpen(false) });

  const tipContext = getTipContext(pathname);
  const pageTip = tipContext ? pageContextMessages[tipContext]?.[0] : undefined;

  // Guided position: while a guide step is active, move the FAB next to the
  // target element so it visually "guides" the user (dynamic movement logic).
  const guidedPosition =
    guideState?.isActive && targetPosition?.targetRect
      ? {
          x: targetPosition.targetRect.right + 12,
          y: Math.max(72, targetPosition.targetRect.top + targetPosition.targetRect.height / 2 - 28),
        }
      : null;

  // Restore dismissed state on mount
  useEffect(() => {
    try {
      if (localStorage.getItem('freddy-chat-dismissed') === 'true') {
        setDismissed(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Keep the root key handler wired (Escape closes the panel) — handled by
  // useDishaKeyboard above, no extra listener needed.

  // Auto-open on first visit — once per browser session, never on auth/admin
  // pages (so forms are never covered), and only when not dismissed.
  useEffect(() => {
    if (dismissed || messages.length > 0) return;
    if (tipContext === 'auth' || tipContext === 'admin') return;
    let seen = false;
    try {
      seen = sessionStorage.getItem('freddy-chat-autoopened') === '1';
    } catch {
      // ignore
    }
    if (seen) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
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
  }, [dismissed, messages.length, tipContext]);

  // When a guide flow becomes active, bring up the panel so the guidance is
  // visible (the FAB also moves to the target field). When the flow ends or is
  // skipped, the FAB springs back to its default bottom-right anchor.
  useEffect(() => {
    if (!guideState?.isActive || !currentStep) return;
    if (dismissed || isOpen) return;
    setIsOpen(true);
    if (currentStep.mood) setMood(currentStep.mood);
  }, [guideState?.isActive, currentStep, dismissed, isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const el = scrollAreaRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const addUserMessage = useCallback((content: string) => {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const addBotMessage = useCallback((content: string, isTyping = false) => {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      isTyping,
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

  const handleSend = useCallback(async () => {
    const message = inputValue.trim();
    if (!message || isLoading) return;

    setInputValue('');
    setIsLoading(true);
    setMood('thinking');
    addUserMessage(message);

    // typing indicator
    addBotMessage('', true);

    try {
      const pageContext = typeof window !== 'undefined' ? getPageContext(window.location.pathname) : 'General inquiry';

      const response = (await freddyAI.ask(message, pageContext)) as AiResponse;

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
  }, [inputValue, isLoading, addUserMessage, addBotMessage, getSuggestedReply]);

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
      setInputValue(action.message);
      setMood(action.mood || 'thinking');
      setTimeout(() => {
        handleSend();
      }, 300);
    },
    [handleSend]
  );

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        // Keep ScrollToTopFab coordinated (same event the old FloatingCTA used).
        window.dispatchEvent(new CustomEvent('lsaathi-fab-open', { detail: { open: next } }));
      }
      if (next) {
        setMood('waking');
        setTimeout(() => setMood('idle'), 500);
      } else {
        setMood('idle');
      }
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setMood('idle');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lsaathi-fab-open', { detail: { open: false } }));
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setIsOpen(false);
    setMood('idle');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lsaathi-fab-open', { detail: { open: false } }));
    }
    try {
      localStorage.setItem('freddy-chat-dismissed', 'true');
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleRestore = useCallback(() => {
    setDismissed(false);
    try {
      localStorage.removeItem('freddy-chat-dismissed');
    } catch {
      // ignore
    }
  }, []);

  const handleLinkClick = useCallback((path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  }, []);

  const renderMessageContent = useCallback(
    (content: string, role: 'user' | 'assistant') => {
      const parts = content.split(/(:\/\/[^\s]+|\/[a-zA-Z0-9\/-]+)/g);

      return parts.map((part, index) => {
        const linkMatch = part.match(/^(\/[a-zA-Z0-9\/-]+)$/);
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

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={handleRestore}
        className="fixed bottom-24 right-4 z-[100] inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/95 px-4 py-2 text-xs font-semibold text-orange-700 shadow-lg backdrop-blur transition-colors hover:bg-orange-50 dark:border-orange-900/40 dark:bg-gray-900/95 dark:text-orange-300 dark:hover:bg-gray-800"
        aria-label="Show Freddy the LoadSaathi assistant"
      >
        <span aria-hidden>🐻</span> Show Freddy
      </button>
    );
  }

  return (
    <>
      {/* Floating trigger — the Freddy avatar itself (high-contrast white) */}
      <motion.button
        type="button"
        onClick={toggleOpen}
        aria-label={isOpen ? 'Close Freddy chat' : 'Open Freddy chat'}
        className="fixed z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-white border border-gray-200 shadow-lg shadow-black/10 hover:shadow-xl transition-shadow duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        style={
          guidedPosition
            ? { left: guidedPosition.x, top: guidedPosition.y, right: 'auto', bottom: 'auto' }
            : { right: 16, bottom: 96 }
        }
        initial={reducedMotion ? {} : { scale: 0, opacity: 0 }}
        animate={reducedMotion ? {} : { scale: isOpen ? 0.9 : 1, opacity: isOpen ? 0.9 : 1 }}
        whileHover={reducedMotion ? {} : { scale: 1.05 }}
        whileTap={reducedMotion ? {} : { scale: 0.95 }}
      >
        <span className="pointer-events-none flex h-12 w-12 items-center justify-center overflow-hidden rounded-full">
          <Freddy animation={moodToFreddyAnimation[mood]} size={44} />
        </span>
        {!isOpen && (
          <motion.span
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            !
          </motion.span>
        )}
      </motion.button>

      {/* Panel */}
      <motion.div
        className="fixed bottom-24 right-4 z-[100] w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-180px)] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden flex flex-col"
        initial={reducedMotion ? {} : { opacity: 0, y: 20, scale: 0.95, rotateX: 10 }}
        animate={
          reducedMotion
            ? {}
            : {
                opacity: isOpen ? 1 : 0,
                y: isOpen ? 0 : 20,
                scale: isOpen ? 1 : 0.95,
                rotateX: isOpen ? 0 : 10,
                pointerEvents: isOpen ? 'auto' : 'none',
              }
        }
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={() => !reducedMotion && setMood('excited')}
        onMouseLeave={() => setMood('idle')}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-orange-200 dark:border-orange-800">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
            <Freddy animation={moodToFreddyAnimation[mood]} size={36} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              Freddy, your LoadSaathi assistant
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              Ask me anything about freight & LoadSaathi
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-muted-foreground hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950"
              title="Dismiss chat"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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

              {/* Messages */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-3">
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
              </ScrollArea>

              {/* Input */}
              <div className="flex items-center gap-2 px-4 py-3 border-t border-orange-200 dark:border-orange-800">
                <Input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Freddy anything..."
                  disabled={isLoading}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm py-2"
                />
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

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
          <p className="text-[10px] text-muted-foreground text-center">
            Powered by AI • Free to use • 🎯 LoadSaathi
          </p>
        </div>
      </motion.div>
    </>
  );
}
