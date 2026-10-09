import { Link } from "react-router-dom";
import { ArrowLeft, Calculator, Route, MapPin, Truck, FileCheck, Leaf, Fuel, Receipt, Box, TrendingUp, Scale, IndianRupee, BarChart3, FileText, Clock, GitCompareArrows, Boxes, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SeoMeta from "@/components/SeoMeta";

const tools = [
  { title: "Fare Calculator", desc: "Estimate end-to-end truck fares for any Indian city pair.", path: "/tools/fare-calculator", icon: IndianRupee },
  { title: "Freight Rate Calculator", desc: "Compare per-kg rates across PTL, FTL, and LTL modes.", path: "/tools/freight-rate-calculator", icon: Calculator },
  { title: "Transport Cost Calculator", desc: "Calculate total transport cost including fuel, tolls, and driver wages.", path: "/transport-cost-calculator", icon: BarChart3 },
  { title: "Truck Load Calculator", desc: "Determine optimal load weight and payload distribution.", path: "/tools/truck-load-calculator", icon: Truck },
  { title: "PTL vs FTL Calculator", desc: "Decide whether Part Truck Load or Full Truck Load saves more.", path: "/tools/ptl-vs-ftl-calculator", icon: Scale },
  { title: "Return Load Calculator", desc: "Find savings by booking return loads on empty backhaul legs.", path: "/tools/return-load-calculator", icon: ArrowLeft },
  { title: "Route Optimizer", desc: "Plan the fastest or cheapest multi-stop truck route.", path: "/tools/route-optimizer", icon: Route },
  { title: "Empty Km Savings", desc: "Quantify revenue lost to empty running and how to recover it.", path: "/tools/empty-km-savings", icon: MapPin },
  { title: "Trip Profit Calculator", desc: "See net profit after fuel, tolls, maintenance, and driver costs.", path: "/tools/trip-profit", icon: TrendingUp },
  { title: "Shared Savings Calculator", desc: "Estimate savings from co-loading with other shippers.", path: "/tools/shared-savings", icon: Box },
  { title: "Document Checklist", desc: "Verify every mandatory trucking document before dispatch.", path: "/tools/document-checklist", icon: FileCheck },
  { title: "Carbon Savings Calculator", desc: "Measure CO₂ reduction from optimized routing and shared loads.", path: "/tools/carbon-savings", icon: Leaf },
  { title: "Toll & Fuel Calculator", desc: "Get toll and fuel cost estimates for any Indian highway route.", path: "/tools/toll-fuel", icon: Fuel },
  { title: "GST Calculator", desc: "Calculate GST on freight invoices with HSN code lookup.", path: "/tools/gst-calculator", icon: Receipt },
  { title: "Payload Utilization", desc: "Maximize cargo volume per trip with space utilisation insights.", path: "/tools/payload-utilization", icon: Box },
  { title: "Shipment Brief Builder", desc: "Build a complete freight request to share with transporters for accurate quotes.", path: "/tools/shipment-brief", icon: FileText },
  { title: "Waiting-Time Cost Calculator", desc: "Estimate what truck waiting time at loading and unloading really costs.", path: "/tools/waiting-time-cost", icon: Clock },
  { title: "Freight Quote Comparison", desc: "Compare quotes all-in — every charge, transit time and payment terms.", path: "/tools/freight-quote-comparison", icon: GitCompareArrows },
  { title: "Cargo Volume Planner", desc: "Total volume, weight and space estimate for part-load shipments.", path: "/tools/cargo-volume-planner", icon: Boxes },
  { title: "Load-Securing Checklist", desc: "Packing, loading and dispatch checklist by cargo type and handling needs.", path: "/tools/load-securing-checklist", icon: ClipboardList },
];

export default function Tools() {
  return (
    <>
      <SeoMeta
        title="Logistics Tools & Calculators for Indian Truckers & Shippers"
        description="20 free freight tools and logistics calculators for Indian truckers and shippers — fare estimates, shipment briefs, quote comparison, route optimisation, GST, carbon savings, and more."
        canonical="/tools"
        breadcrumbs={[{ name: "Tools", url: "/tools" }]}
      />
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
          Logistics Tools &amp; Calculators
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mb-10">
          Free, India-focused tools to help truckers and shippers make smarter freight decisions.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.path} to={tool.path}>
                <Card className="h-full hover:border-orange-400 dark:hover:border-orange-500 transition-colors group">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-5 w-5 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
                      {tool.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{tool.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
