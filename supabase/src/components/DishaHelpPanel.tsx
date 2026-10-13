import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, Wand2, MapPin, Truck, Package, HelpCircle, LayoutDashboard, FileText, Calculator, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from './DishaMascot'
import type { DishaMood } from './DishaMascot'

interface DishaHelpPanelProps {
  open: boolean
  onClose: () => void
  mood?: DishaMood
  accent?: 'orange' | 'blue'
  pageContext?: 'public-landing' | 'public-public' | 'auth' | 'shipper' | 'trucker' | 'admin' | 'profile' | 'shipper-post' | 'trucker-post' | 'unknown'
}

type HelpTip = {
  icon: React.ReactNode
  title: string
  text: string
  actionLabel: string
  action: string
}

function buildTipsForContext(pageContext?: DishaHelpPanelProps['pageContext']): HelpTip[] {
  switch (pageContext) {
    case 'public-landing':
      return [
        { icon: <Package className="h-5 w-5" />, title: 'Post a shipment', text: 'Have goods to move? Post your load and get matched with verified truckers on your route.', actionLabel: 'Post shipment', action: '/register' },
        { icon: <Truck className="h-5 w-5" />, title: 'Find trucks', text: 'Trucker? Find loads to fill your empty space and earn more on every trip.', actionLabel: 'Browse loads', action: '/register' },
        { icon: <Calculator className="h-5 w-5" />, title: 'Check pricing', text: 'Quickly estimate freight rates between any two cities using our AI-powered fare calculator.', actionLabel: 'Calculate fare', action: '/tools/fare-calculator' },
        { icon: <HelpCircle className="h-5 w-5" />, title: 'How it works', text: 'Our step-by-step guide explains how shippers and truckers connect and transact on the platform.', actionLabel: 'Read the guide', action: '/how-it-works' },
      ]
    case 'shipper':
      return [
        { icon: <Package className="h-5 w-5" />, title: 'Post a load', text: 'Enter origin, destination, weight, and timeline to get matched with trucks.', actionLabel: 'Post shipment', action: '/shipper/post-shipment' },
        { icon: <Truck className="h-5 w-5" />, title: 'Browse trucks', text: 'See available trucks on your route and compare rates side by side.', actionLabel: 'Browse trucks', action: '/browse-trucks' },
        { icon: <FileText className="h-5 w-5" />, title: 'My shipments', text: 'View the status of all your posted shipments in one dashboard.', actionLabel: 'View shipments', action: '/shipper/my-shipments' },
        { icon: <Star className="h-5 w-5" />, title: 'Credit score', text: 'Check your shipper credit score and learn how to improve your match rate.', actionLabel: 'Check score', action: '/credit-score' },
      ]
    case 'trucker':
      return [
        { icon: <Truck className="h-5 w-5" />, title: 'Post a trip', text: 'Enter your route and capacity to start getting matched with shipments.', actionLabel: 'Post trip', action: '/trucker/post-trip' },
        { icon: <Package className="h-5 w-5" />, title: 'Browse loads', text: 'Find shipments matching your route and truck size.', actionLabel: 'Browse loads', action: '/trucker/browse-shipments' },
        { icon: <LayoutDashboard className="h-5 w-5" />, title: 'My trips', text: 'See every trip you have posted and their current status.', actionLabel: 'View trips', action: '/trucker/my-trips' },
        { icon: <Star className="h-5 w-5" />, title: 'Check earnings', text: 'View your trip earnings, ratings, and credit score.', actionLabel: 'View earnings', action: '/trucker/dashboard' },
      ]
    case 'auth':
      return [
        { icon: <HelpCircle className="h-5 w-5" />, title: 'Need help signing up?', text: 'I can walk you through the entire signup and onboarding process step by step.', actionLabel: 'Show me the tour', action: 'tour' },
        { icon: <Package className="h-5 w-5" />, title: 'Shipper quick start', text: 'I have goods to transport and need reliable trucks at the best prices.', actionLabel: 'Go as shipper', action: '/register?type=shipper' },
        { icon: <Truck className="h-5 w-5" />, title: 'Trucker quick start', text: 'I have a truck and want to find loads to fill my empty space.', actionLabel: 'Go as trucker', action: '/register?type=trucker' },
        { icon: <FileText className="h-5 w-5" />, title: 'Forgot password?', text: 'Reset your password by entering your email address.', actionLabel: 'Reset password', action: '/forgot-password' },
      ]
    default:
      return [
        { icon: <Wand2 className="h-5 w-5" />, title: 'Quick start', text: 'New here? I can walk you through getting started on LoadSaathi.', actionLabel: 'Show options', action: 'options' },
        { icon: <Package className="h-5 w-5" />, title: 'Post a shipment', text: 'Post your shipment details and I will point you to the right next step.', actionLabel: 'Go to post shipment', action: '/shipper/post-shipment' },
        { icon: <Truck className="h-5 w-5" />, title: 'For truckers', text: 'Browse available loads and see where you can fill empty space.', actionLabel: 'Browse loads', action: '/trucker/browse-shipments' },
        { icon: <MapPin className="h-5 w-5" />, title: 'Find a route', text: 'Explore freight routes and location pages across East India.', actionLabel: 'Browse routes', action: '/routes' },
      ]
  }
}

export default function DishaHelpPanel({ open, onClose, mood = 'idle', accent = 'orange', pageContext }: DishaHelpPanelProps) {
  const reducedMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const tips = buildTipsForContext(pageContext)

  useEffect(() => {
    if (!open || !panelRef.current) return
    const autoFocus = panelRef.current.querySelector<HTMLButtonElement>('[data-disha-auto-focus]')
    autoFocus?.focus()
  }, [open])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'clip'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleAction = (action: string) => {
    if (action.startsWith('/')) {
      onClose()
      navigate(action)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={reducedMotion ? {} : { opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? {} : { opacity: 0, y: 6, scale: 0.97 }}
          transition={{ duration: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
          className="fixed left-1/2 top-1/2 z-[9999] w-[calc(100vw-2rem)] max-w-[420px] translate-x-[-50%] translate-y-[-50%] rounded-2xl border shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disha-panel-title"
        >
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <div
            className={cn(
              'relative ml-[50%] mt-[50%] h-[min(80vh,520px)] w-[min(calc(100vw-2rem),420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 overflow-hidden flex flex-col',
              accent === 'orange' ? 'border-orange-200 bg-white dark:border-orange-800 dark:bg-gray-900' : 'border-blue-200 bg-white dark:border-blue-800 dark:bg-gray-900',
            )}
          >
            <div className={cn('flex items-center gap-3 px-4 pt-4 pb-3 border-b', accent === 'orange' ? 'border-orange-200 dark:border-orange-800' : 'border-blue-200 dark:border-blue-800')}>
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br', accent === 'orange' ? 'from-orange-400 to-orange-600' : 'from-blue-400 to-blue-600')}>
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="disha-panel-title" className="text-base font-semibold truncate">
                  Disha, your LoadSaathi assistant
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  Context-aware help for your current page
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
                aria-label="Close Disha help"
                data-disha-auto-focus
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className={cn('flex items-center gap-2 px-4 py-2 border-b text-xs text-muted-foreground', accent === 'orange' ? 'border-orange-200 dark:border-orange-800' : 'border-blue-200 dark:border-blue-800')}>
              <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-[11px] font-medium uppercase tracking-wider">
                {mood}
              </span>
              <span className="text-[11px] text-muted-foreground/80">
                You can press Escape to close me
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <p className="text-sm leading-relaxed">
                Hi, I’m Disha. I’m here to help you take the next step without blocking anything else on the page.
              </p>
              {tips.map((tip) => (
                <button
                  key={tip.title}
                  type="button"
                  onClick={() => handleAction(tip.action)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent/50 active:scale-[0.99]',
                    accent === 'orange' ? 'border-orange-100 dark:border-orange-800/40' : 'border-blue-100 dark:border-blue-800/40',
                  )}
                  aria-label={`${tip.title}: ${tip.text}`}
                >
                  <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted', accent === 'orange' ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400')}>
                    {tip.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{tip.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{tip.text}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-[11px] font-medium">{tip.actionLabel}</span>
                </button>
              ))}
            </div>

            <div className={cn('flex items-center justify-between px-4 py-3 border-t text-xs', accent === 'orange' ? 'border-orange-200 dark:border-orange-800' : 'border-blue-200 dark:border-blue-800')}>
              <div className="flex items-center gap-2 text-muted-foreground">
                <HelpCircle className="h-4 w-4" />
                <span>Need the full site?</span>
              </div>
              <Link
                to="/"
                onClick={onClose}
                className={cn(
                  'inline-flex items-center gap-1 font-medium text-[11px] hover:text-inherit',
                  accent === 'orange' ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400',
                )}
              >
                Back to home <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
