import type { Config, DriveStep } from 'driver.js';

export type UserType = 'trucker' | 'shipper';

export type TourId =
  | 'entry.trucker'
  | 'entry.shipper'
  | 'chrome.universal'
  | 'trucker.dashboard'
  | 'trucker.post-trip'
  | 'trucker.my-trips'
  | 'trucker.browse-shipments'
  | 'trucker.history'
  | 'shipper.dashboard'
  | 'shipper.post-shipment'
  | 'shipper.my-shipments'
  | 'shipper.browse-trucks'
  | 'shipper.history'
  | 'account.profile'
  | 'account.favorites'
  | 'account.credit-score'
  | 'messaging.messages';

export interface TourSpec {
  id: TourId;
  paths: string[];
  roles: UserType[];
  buildSteps: () => DriveStep[];
  chainTo?: { path: string; tourId: TourId };
}

const TOUR_DONE_PREFIX = 'loadsaathi-tour-done-';

export function tourDoneKey(userId: string, tourId: TourId) {
  return `${TOUR_DONE_PREFIX}${userId}-${tourId}`;
}

export function markTourDone(userId: string, tourId: TourId) {
  try {
    localStorage.setItem(tourDoneKey(userId, tourId), '1');
  } catch {
    /* ignore — private mode */
  }
}

export function isTourDone(userId: string, tourId: TourId): boolean {
  try {
    return localStorage.getItem(tourDoneKey(userId, tourId)) === '1';
  } catch {
    return false;
  }
}

export function resetTour(userId: string) {
  try {
    const prefix = `${TOUR_DONE_PREFIX}${userId}-`;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore */
  }
}

export const tourEntryFlagKey = (userId: string) => `loadsaathi-tour-entry-${userId}`;

export function setTourEntryFlag(userId: string) {
  try {
    localStorage.setItem(tourEntryFlagKey(userId), '1');
  } catch {
    /* ignore */
  }
}

export function consumeTourEntryFlag(userId: string): boolean {
  try {
    const v = localStorage.getItem(tourEntryFlagKey(userId));
    localStorage.removeItem(tourEntryFlagKey(userId));
    return v === '1';
  } catch {
    return false;
  }
}

export const truckerNextPath = '/trucker/post-trip';
export const shipperNextPath = '/shipper/post-shipment';
export const truckerHubPath = '/trucker/my-trips';
export const shipperHubPath = '/shipper/my-shipments';
export const truckerBrowsePath = '/trucker/browse-shipments';
export const shipperBrowsePath = '/browse-trucks';
export const chatPath = '/messages';

export function filterPresentSteps(steps: DriveStep[]): DriveStep[] {
  return steps.filter((step) => {
    if (!step.element) return true;
    if (typeof step.element === 'string') {
      return document.querySelector(step.element) !== null;
    }
    return true;
  });
}

function popover(title: string, description: string, opts?: Partial<DriveStep['popover']>): DriveStep['popover'] {
  return {
    title,
    description,
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    ...opts,
  };
}

export function buildTruckerDashboardSteps(onNavigateToForm?: () => void): DriveStep[] {
  return [
    {
      element: '#trucker-dashboard-header',
      popover: popover(
        'Welcome to LoadSaathi',
        'Your dashboard shows your trips, earnings and live fleet at a glance.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#trucker-stat-cards',
      popover: popover(
        'Your stats',
        'Live Trips, New Requests, Completed Trips and Total Earnings — tap any card to drill in.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#trucker-quick-actions',
      popover: popover(
        'Post your first trip',
        'Tap "Post New Trip" to publish your truck\'s available capacity to shippers on your route.',
        { side: 'right' },
      ),
    },
    {
      element: '#nearby-loads-map',
      popover: popover(
        'Loads near you',
        'Live shipments posted by shippers — see who needs a truck on your route right now.',
        { side: 'top' },
      ),
    },
    {
      element: '#trucker-credit-score',
      popover: popover(
        'Driver Risk Score',
        'Your credit score helps shippers trust you. Complete trips and stay responsive to grow it.',
        { side: 'top' },
      ),
      skipMissingElement: true,
    },
    {
      element: '#nav-post',
      popover: popover(
        'Or use the nav',
        'You can always post a trip from the navigation bar here.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#main-content',
      popover: popover(
        'Ready to post?',
        'Let\'s fill in your first trip — it takes under a minute.',
        onNavigateToForm
          ? { side: 'top', onNextClick: onNavigateToForm }
          : { side: 'top' },
      ),
    },
  ];
}

export function buildShipperDashboardSteps(onNavigateToForm?: () => void): DriveStep[] {
  return [
    {
      element: '#shipper-dashboard-header',
      popover: popover(
        'Welcome to LoadSaathi',
        'Your dashboard shows active loads, incoming offers and recent shipments.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#live-truck-map',
      popover: popover(
        'Live trucks on the road',
        'Watch verified truckers move your goods in real time — pickup to delivery.',
        { side: 'top' },
      ),
    },
    {
      element: '#shipper-stat-cards',
      popover: popover(
        'Your stats',
        'Active Loads, New Offers, Completed and Total Spent — tap to drill in.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#shipper-quick-actions',
      popover: popover(
        'Post your first load',
        'Tap "Post New Load" to tell truckers what you need to move. Takes under a minute.',
        { side: 'right' },
      ),
    },
    {
      element: '#nav-post',
      popover: popover(
        'Or use the nav',
        'You can always post a load from the navigation bar here.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#main-content',
      popover: popover(
        'Ready to post?',
        'Let\'s fill in your first shipment — it takes under a minute.',
        onNavigateToForm
          ? { side: 'top', onNextClick: onNavigateToForm }
          : { side: 'top' },
      ),
    },
  ];
}

export function buildTruckerFormSteps(): DriveStep[] {
  return [
    {
      element: '#post-trip-header',
      popover: popover(
        'Post a new trip',
        'Tell shippers where you\'re going and what you can carry.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#post-trip-origin',
      popover: popover(
        'Origin',
        'Pick the city where your truck will start. The list is searchable.',
        { side: 'right' },
      ),
    },
    {
      element: '#post-trip-destination',
      popover: popover(
        'Destination',
        'Pick where you\'re headed.',
        { side: 'right' },
      ),
    },
    {
      element: '#date',
      popover: popover(
        'Departure date',
        'When will you leave? Shippers see this to plan pickup.',
        { side: 'right' },
      ),
    },
    {
      element: '#capacity',
      popover: popover(
        'Available capacity',
        'How many tonnes of cargo can you still take on this trip?',
        { side: 'right' },
      ),
    },
    {
      element: '#price',
      popover: popover(
        'Price per tonne',
        'Set your rate. The Price Predictor suggests market rates for your route.',
        { side: 'right' },
      ),
    },
    {
      element: '#vehicleType',
      popover: popover(
        'Vehicle type',
        'Truckers with matching vehicles see this trip first.',
        { side: 'right' },
      ),
    },
    {
      element: '#post-trip-submit',
      popover: popover(
        'Post your trip',
        'When you\'re done, tap here to publish. Shippers can request a booking instantly.',
        { side: 'top' },
      ),
    },
  ];
}

export function buildShipperFormSteps(): DriveStep[] {
  return [
    {
      element: '#post-shipment-header',
      popover: popover(
        'Post a new shipment',
        'Tell truckers what you need to move. Takes under a minute.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#post-shipment-origin',
      popover: popover(
        'Pickup city',
        'Where should the truck arrive to collect your goods?',
        { side: 'right' },
      ),
    },
    {
      element: '#post-shipment-destination',
      popover: popover(
        'Delivery city',
        'Where do the goods need to go?',
        { side: 'right' },
      ),
    },
    {
      element: '#date',
      popover: popover(
        'Ready date',
        'When is the shipment ready for pickup?',
        { side: 'right' },
      ),
    },
    {
      element: '#weight',
      popover: popover(
        'Weight',
        'How heavy is it? Truckers filter by capacity on their trucks.',
        { side: 'right' },
      ),
    },
    {
      element: '#goods',
      popover: popover(
        'Goods description',
        'Be specific — fragile, perishable, hazardous — helps truckers quote accurately.',
        { side: 'right' },
      ),
    },
    {
      element: '#budget',
      popover: popover(
        'Budget per tonne',
        'Your target rate. The Price Predictor suggests market rates for your route.',
        { side: 'right' },
      ),
    },
    {
      element: '#post-shipment-submit',
      popover: popover(
        'Post your shipment',
        'When you\'re done, tap here. You\'ll get offers from truckers within minutes.',
        { side: 'top' },
      ),
    },
  ];
}

export function buildTruckerHubSteps(): DriveStep[] {
  return [
    {
      element: '#trucker-hub-header',
      popover: popover(
        'Your Trip Hub',
        'See every load you\'ve posted, sent offers, and incoming booking requests.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#trucker-hub-tabs',
      popover: popover(
        'Switch views',
        'Jump between My Trips, Sent Offers, and Booking Requests without leaving this page.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#trucker-hub-my-trips-grid',
      popover: popover(
        'My Trips',
        'Every trip you\'ve posted. Track status, edit details, or mark as completed.',
        { side: 'right' },
      ),
      skipMissingElement: true,
    },
    {
      element: '#trucker-hub-post-trip-btn',
      popover: popover(
        'Post a new trip',
        'Need more capacity? Tap here to publish a new trip in under a minute.',
        { side: 'left' },
      ),
    },
  ];
}

export function buildBrowseShipmentsSteps(): DriveStep[] {
  return [
    {
      element: '#browse-shipments-header',
      popover: popover(
        'Find shipments',
        'Browse loads posted by shippers that match your route and capacity.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#browse-shipments-search',
      popover: popover(
        'Search',
        'Filter by city, goods type, or shipper name to narrow results fast.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#browse-shipments-filters-btn',
      popover: popover(
        'Advanced filters',
        'Set weight, budget, pickup date and more to find the perfect load.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#browse-shipments-results',
      popover: popover(
        'Results',
        'Each card shows the route, weight, budget and match score. Send an offer in one tap.',
        { side: 'top' },
      ),
      skipMissingElement: true,
    },
  ];
}

export function buildTruckerHistorySteps(): DriveStep[] {
  return [
    {
      element: '#trucker-history-header',
      popover: popover(
        'Trip History',
        'Review every completed, pending or cancelled trip in one place.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#trucker-history-stat-cards',
      popover: popover(
        'Summary stats',
        'Total trips, completed, pending and this month\'s earnings at a glance.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#trucker-history-filters',
      popover: popover(
        'Filter history',
        'Use activity type and status filters to find exactly what you need.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#trucker-history-list',
      popover: popover(
        'Activity list',
        'Tap any entry to view full details, earnings, and client feedback.',
        { side: 'top' },
      ),
      skipMissingElement: true,
    },
  ];
}

export function buildShipperHubSteps(): DriveStep[] {
  return [
    {
      element: '#shipper-hub-header',
      popover: popover(
        'Your Shipment Hub',
        'Manage every load you\'ve posted, sent requests, and incoming offers.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#shipper-hub-tabs',
      popover: popover(
        'Switch views',
        'Jump between My Loads, Sent Requests, and Incoming Offers.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#shipper-hub-my-loads-grid',
      popover: popover(
        'My Loads',
        'Track active, pending and completed shipments. Edit or cancel anytime.',
        { side: 'right' },
      ),
      skipMissingElement: true,
    },
    {
      element: '#shipper-hub-post-load-btn',
      popover: popover(
        'Post a new load',
        'Need to move something? Tap here to create a new shipment in under a minute.',
        { side: 'left' },
      ),
    },
  ];
}

export function buildBrowseTripsSteps(): DriveStep[] {
  return [
    {
      element: '#browse-trips-header',
      popover: popover(
        'Find trucks',
        'Browse verified truckers moving goods on routes you need.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#browse-trips-search',
      popover: popover(
        'Search',
        'Filter by city, trucker name, or route to find the right match.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#browse-trips-filters-btn',
      popover: popover(
        'Advanced filters',
        'Set origin, destination, capacity, price and vehicle type to narrow results.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#browse-trips-results',
      popover: popover(
        'Results',
        'Each card shows the trucker\'s rating, route, capacity and price. Request a booking in one tap.',
        { side: 'top' },
      ),
      skipMissingElement: true,
    },
  ];
}

export function buildShipperHistorySteps(): DriveStep[] {
  return [
    {
      element: '#shipper-history-header',
      popover: popover(
        'Shipment History',
        'Review every load you\'ve posted and booking request in one place.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#shipper-history-stat-cards',
      popover: popover(
        'Summary stats',
        'Total, completed, pending and this month\'s spend at a glance.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#shipper-history-filters',
      popover: popover(
        'Filter history',
        'Use activity type and status filters to find past loads quickly.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#shipper-history-list',
      popover: popover(
        'Activity list',
        'Tap any entry to view full shipment details and trucker feedback.',
        { side: 'top' },
      ),
      skipMissingElement: true,
    },
  ];
}

export function buildProfileSteps(): DriveStep[] {
  return [
    {
      element: '#profile-header',
      popover: popover(
        'Your Profile',
        'Manage your personal info, verification, and account settings here.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#profile-tabs',
      popover: popover(
        'Profile tabs',
        'Overview, Reviews, Personal Info, and Security — all in one place.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#profile-overview',
      popover: popover(
        'Overview',
        'See your total trips or shipments, average rating and credit score card.',
        { side: 'right' },
      ),
      skipMissingElement: true,
    },
    {
      element: '#profile-save-button',
      popover: popover(
        'Save changes',
        'Update your name, phone or company and tap here to persist.',
        { side: 'left' },
      ),
      skipMissingElement: true,
    },
  ];
}

export function buildFavoritesSteps(): DriveStep[] {
  return [
    {
      element: '#favorites-header',
      popover: popover(
        'Saved Favorites',
        'Quick access to trips, shipments and users you\'ve saved.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#favorites-tabs',
      popover: popover(
        'Filter favorites',
        'Switch between saved trips, shipments, and users.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#favorites-list',
      popover: popover(
        'Your list',
        'Tap any card to open details. Use the heart to unsave.',
        { side: 'top' },
      ),
      skipMissingElement: true,
    },
  ];
}

export function buildCreditScoreSteps(): DriveStep[] {
  return [
    {
      element: '#credit-score-header',
      popover: popover(
        'Credit Score',
        'Your trust score on LoadSaathi — based on activity, reviews and reliability.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#credit-score-gauge',
      popover: popover(
        'Score gauge',
        'Higher scores unlock better matching, lower fees and premium visibility.',
        { side: 'right' },
      ),
    },
    {
      element: '#credit-score-tabs',
      popover: popover(
        'Breakdown, history, insights',
        'Drill into factors, past trends and AI-powered tips to improve.',
        { side: 'bottom' },
      ),
    },
  ];
}

export function buildChatListSteps(): DriveStep[] {
  return [
    {
      element: '#messages-header',
      popover: popover(
        'Messages',
        'All your conversations with shippers and truckers in one inbox.',
        { side: 'bottom', align: 'start' },
      ),
    },
    {
      element: '#messages-list',
      popover: popover(
        'Conversations',
        'Tap any chat to open the full thread. Unread counts show new messages.',
        { side: 'top' },
      ),
      skipMissingElement: true,
    },
  ];
}

export function buildUniversalChromeSteps(): DriveStep[] {
  return [
    {
      element: '#app-sidebar',
      popover: popover(
        'Navigation',
        'The sidebar is your map of LoadSaathi. Tap any item to jump there.',
        { side: 'right' },
      ),
    },
    {
      element: '#app-notifications',
      popover: popover(
        'Notifications',
        'The bell is where new requests, offers and messages show up.',
        { side: 'bottom' },
      ),
    },
    {
      element: '#app-profile-menu',
      popover: popover(
        'Profile menu',
        'Your profile, credit score and sign-out live here.',
        { side: 'bottom' },
      ),
    },
  ];
}

export function buildDriverConfig(spec: TourSpec, userId: string): Config {
  const popoverClass = spec.id.startsWith('trucker') || spec.id.startsWith('entry.trucker')
    ? 'driver-trucker'
    : 'driver-shipper';
  const highlightClass = spec.id.startsWith('trucker') || spec.id.startsWith('entry.trucker')
    ? 'driver-trucker-highlight'
    : 'driver-shipper-highlight';

  const handleDone = () => {
    markTourDone(userId, spec.id);
    if (spec.chainTo) {
      markTourDone(userId, spec.chainTo.tourId);
    }
  };

  return {
    animate: true,
    duration: 320,
    smoothScroll: true,
    allowClose: true,
    allowScroll: true,
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 8,
    popoverClass,
    showButtons: ['next', 'previous', 'close'],
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Done ✓',
    waitForElement: 3000,
    skipMissingElement: true,
    onDestroyed: (() => handleDone()) as Config['onDestroyed'],
    onCloseClick: (() => handleDone()) as Config['onCloseClick'],
    onHighlighted: ((el) => {
      const element = el as HTMLElement | undefined;
      if (!element) return;
      element.classList.add(highlightClass);
      (element as HTMLElement & { __tourHighlightClass?: string }).__tourHighlightClass = highlightClass;
    }) as Config['onHighlighted'],
    onDeselected: ((el) => {
      const element = el as (HTMLElement & { __tourHighlightClass?: string }) | undefined;
      if (!element) return;
      const cls = element.__tourHighlightClass;
      if (cls) element.classList.remove(cls);
    }) as Config['onDeselected'],
  };
}

export const TOUR_REGISTRY: TourSpec[] = [
  {
    id: 'entry.trucker',
    paths: ['/trucker/dashboard'],
    roles: ['trucker'],
    buildSteps: () => buildTruckerDashboardSteps(() => {
      try {
        const w = window as Window & { __loadsaathiNav?: (p: string) => void };
        if (typeof w.__loadsaathiNav === 'function') {
          w.__loadsaathiNav('/trucker/post-trip');
          return;
        }
      } catch {
        /* ignore */
      }
      try {
        localStorage.setItem('loadsaathi-tour-next-path', '/trucker/post-trip');
        localStorage.setItem('loadsaathi-tour-next-role', 'trucker');
      } catch {
        /* ignore */
      }
      window.location.assign('/trucker/post-trip');
    }),
    chainTo: { path: '/trucker/post-trip', tourId: 'trucker.post-trip' },
  },
  {
    id: 'entry.shipper',
    paths: ['/shipper/dashboard'],
    roles: ['shipper'],
    buildSteps: () => buildShipperDashboardSteps(() => {
      try {
        const w = window as Window & { __loadsaathiNav?: (p: string) => void };
        if (typeof w.__loadsaathiNav === 'function') {
          w.__loadsaathiNav('/shipper/post-shipment');
          return;
        }
      } catch {
        /* ignore */
      }
      try {
        localStorage.setItem('loadsaathi-tour-next-path', '/shipper/post-shipment');
        localStorage.setItem('loadsaathi-tour-next-role', 'shipper');
      } catch {
        /* ignore */
      }
      window.location.assign('/shipper/post-shipment');
    }),
    chainTo: { path: '/shipper/post-shipment', tourId: 'shipper.post-shipment' },
  },
  {
    id: 'chrome.universal',
    paths: ['/trucker/dashboard', '/trucker/post-trip', '/trucker/my-trips', '/trucker/history', '/trucker/browse-shipments', '/shipper/dashboard', '/shipper/post-shipment', '/shipper/my-shipments', '/shipper/history', '/browse-trucks', '/profile', '/favorites', '/credit-score', '/messages'],
    roles: ['trucker', 'shipper'],
    buildSteps: () => buildUniversalChromeSteps(),
  },
  {
    id: 'trucker.dashboard',
    paths: ['/trucker/dashboard'],
    roles: ['trucker'],
    buildSteps: () => buildTruckerDashboardSteps(),
  },
  {
    id: 'trucker.post-trip',
    paths: ['/trucker/post-trip'],
    roles: ['trucker'],
    buildSteps: () => buildTruckerFormSteps(),
  },
  {
    id: 'trucker.my-trips',
    paths: ['/trucker/my-trips'],
    roles: ['trucker'],
    buildSteps: () => buildTruckerHubSteps(),
  },
  {
    id: 'trucker.browse-shipments',
    paths: ['/trucker/browse-shipments'],
    roles: ['trucker'],
    buildSteps: () => buildBrowseShipmentsSteps(),
  },
  {
    id: 'trucker.history',
    paths: ['/trucker/history'],
    roles: ['trucker'],
    buildSteps: () => buildTruckerHistorySteps(),
  },
  {
    id: 'shipper.dashboard',
    paths: ['/shipper/dashboard'],
    roles: ['shipper'],
    buildSteps: () => buildShipperDashboardSteps(),
  },
  {
    id: 'shipper.post-shipment',
    paths: ['/shipper/post-shipment'],
    roles: ['shipper'],
    buildSteps: () => buildShipperFormSteps(),
  },
  {
    id: 'shipper.my-shipments',
    paths: ['/shipper/my-shipments'],
    roles: ['shipper'],
    buildSteps: () => buildShipperHubSteps(),
  },
  {
    id: 'shipper.browse-trucks',
    paths: ['/browse-trucks'],
    roles: ['shipper'],
    buildSteps: () => buildBrowseTripsSteps(),
  },
  {
    id: 'shipper.history',
    paths: ['/shipper/history'],
    roles: ['shipper'],
    buildSteps: () => buildShipperHistorySteps(),
  },
  {
    id: 'account.profile',
    paths: ['/profile'],
    roles: ['trucker', 'shipper'],
    buildSteps: () => buildProfileSteps(),
  },
  {
    id: 'account.favorites',
    paths: ['/favorites'],
    roles: ['trucker', 'shipper'],
    buildSteps: () => buildFavoritesSteps(),
  },
  {
    id: 'account.credit-score',
    paths: ['/credit-score'],
    roles: ['trucker', 'shipper'],
    buildSteps: () => buildCreditScoreSteps(),
  },
  {
    id: 'messaging.messages',
    paths: ['/messages'],
    roles: ['trucker', 'shipper'],
    buildSteps: () => buildChatListSteps(),
  },
];

export function matchSpecForPath(pathname: string, userType: UserType): TourSpec | undefined {
  const exact = TOUR_REGISTRY.find(
    (spec) => spec.roles.includes(userType) && spec.paths.includes(pathname),
  );
  if (exact) return exact;
  const prefix = TOUR_REGISTRY.find(
    (spec) => spec.roles.includes(userType) && spec.paths.some((p) => pathname.startsWith(p)),
  );
  return prefix;
}
