import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  "": "Home",
  "trucker": "Trucker",
  "shipper": "Shipper",
  "admin": "Admin",
  "dashboard": "Dashboard",
  "monitoring": "Command Center",
  "post-trip": "Post Trip",
  "my-trips": "My Trips",
  "post-shipment": "Post Shipment",
  "my-shipments": "My Loads",
  "browse-shipments": "Find Goods",
  "browse-trucks": "Find Trucks",
  "history": "History",
  "users": "Users",
  "moderation": "Moderation",
  "messages": "Messages",
  "chat": "Chat",
  "profile": "Profile",
  "credit-score": "Credit Score",
  "trips": "Trip",
  "shipments": "Shipment",
  "edit": "Edit",
  "home": "Home",
  "features": "Features",
  "how-it-works": "How It Works",
  "about": "About",
  "pricing": "Pricing",
  "faq": "FAQ",
  "contact": "Contact",
  "safety-trust": "Safety & Trust",
  "privacy": "Privacy",
  "terms": "Terms",
  "blog": "Blog",
  "solutions": "Solutions",
  "shippers": "For Shippers",
  "truckers": "For Truckers",
  "screens": "Screens",
  "dashboard-preview": "Dashboard",
  "matching-preview": "AI Matching",
  "chat-preview": "Chat",
  "credit-score-preview": "Credit Score",
  "reviews-preview": "Reviews",
  "admin-preview": "Admin Center",
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="px-6 sm:px-12 max-w-[1440px] mx-auto pt-4 pb-2">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link to="/" className="hover:text-foreground transition-colors">
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>
        {pathnames.map((segment, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
          const isLast = index === pathnames.length - 1;

          return (
            <li key={`${segment}-${index}`} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3" />
              {isLast ? (
                <span className="text-foreground font-medium truncate max-w-[200px]">{label}</span>
              ) : (
                <Link to={routeTo} className="hover:text-foreground transition-colors truncate max-w-[200px]">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
