import { UserPlus, ClipboardList, Search, MapPin, CheckCircle } from 'lucide-react';
import { DollarSign, Route } from 'lucide-react';

export const shipperSteps = [
  { icon: UserPlus, step: '01', title: 'Register Your Account', desc: 'Create your shipper profile in minutes. Add your business details, verify your identity, and get onboarded to the LoadSaathi network.' },
  { icon: ClipboardList, step: '02', title: 'Post Your Shipment', desc: 'Enter shipment details — origin, destination, cargo type, weight, preferred pickup time. Our intelligent form auto-suggests optimal parameters.' },
  { icon: Search, step: '03', title: 'Get AI Matched', desc: 'Our matching engine scans thousands of active trucks and ranks the best matches by route compatibility, pricing, and reliability score — all in seconds.' },
  { icon: MapPin, step: '04', title: 'Track in Real Time', desc: 'Follow your shipment live on the map with accurate ETAs. Get notified at every milestone — pickup, transit, and delivery confirmation.' },
  { icon: CheckCircle, step: '05', title: 'Complete & Review', desc: 'Confirm delivery, release payment securely through our escrow system, and rate the transporter. Build your network of trusted carriers.' },
];

export const truckerSteps = [
  { icon: UserPlus, step: '01', title: 'Register Your Fleet', desc: 'Create your trucker profile with vehicle details, permits, and route preferences. Complete verification to unlock high-value shipments.' },
  { icon: ClipboardList, step: '02', title: 'Post Your Trip', desc: 'Declare your upcoming trips — starting point, destination, available capacity, and preferred load type. Let the AI find matching shipments.' },
  { icon: Search, step: '03', title: 'Find Profitable Loads', desc: 'Browse AI-matched shipments that align with your route and capacity. View fair market prices, distance, and shipper ratings at a glance.' },
  { icon: Route, step: '04', title: 'Haul & Track', desc: 'Navigate optimized routes with live GPS tracking. Update shipment status at each milestone to keep shippers informed and build your reliability score.' },
  { icon: DollarSign, step: '05', title: 'Get Paid Securely', desc: 'Receive payments promptly after successful delivery. Our escrow system protects both parties. Build your credit score with every completed trip.' },
];

export const guideSections = [
  {
    title: 'For Shippers',
    accent: 'orange',
    steps: shipperSteps,
  },
  {
    title: 'For Truckers & Fleet Owners',
    accent: 'blue',
    steps: truckerSteps,
  },
];
