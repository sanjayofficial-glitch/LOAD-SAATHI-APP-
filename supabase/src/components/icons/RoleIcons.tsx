/**
 * RoleIcons — LoadSaathi's reusable semantic icon set.
 *
 * Standardizes the outline icon style used across the signed-in app's
 * navigation and role surfaces. All icons come from lucide-react
 * (ISC license — free for commercial use, no attribution required).
 * Size and stroke width are inherited from the render context via props
 * (lucide default: 24px grid, stroke-width 2), so consumers only pass
 * `className` for sizing (e.g. "h-4 w-4").
 *
 * Where Lucide lacks a logistics glyph (e.g., warehouse / crate / pallet),
 * the icon is intentionally omitted rather than hand-drawn or sourced from
 * a paid set — see the WarehouseIcon note below.
 */
import React from "react";
import {
  LayoutDashboard,
  Search,
  Truck,
  Package,
  PlusCircle,
  MessageSquare,
  Bell,
  User,
  ShieldCheck,
  IndianRupee,
  Heart,
  History,
  Inbox,
  CheckCircle2,
  Weight,
  BadgeCheck,
  MapPin,
  Navigation,
  Route,
  Boxes,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type IconProps = React.SVGProps<SVGSVGElement>;

function make(Icon: LucideIcon) {
  return (props: IconProps) => <Icon {...props} />;
}

/* Navigation */
export const DashboardIcon = make(LayoutDashboard);
export const FindGoodsIcon = make(Search); // trucker: browse available loads
export const FindTrucksIcon = make(Truck); // shipper: browse available trucks
export const PostLoadIcon = make(PlusCircle); // shipper: create shipment
export const PostTripIcon = make(PlusCircle); // trucker: create trip
export const MessagesIcon = make(MessageSquare);
export const NotificationsIcon = make(Bell);
export const ProfileIcon = make(User);
export const FavoritesIcon = make(Heart);
export const HistoryIcon = make(History);

/* Goods / shipments */
export const GoodsIcon = make(Package);
export const ShipmentsIcon = make(Package);
export const MultiLoadIcon = make(Boxes);
export const CapacityIcon = make(Weight); // tonnes / capacity displays
export const RequestsIcon = make(Inbox); // incoming offers / requests

/* Status */
export const CompletedIcon = make(CheckCircle2);
export const VerifiedBadgeIcon = make(BadgeCheck);
export const VerificationIcon = make(ShieldCheck);
export const PaymentsIcon = make(IndianRupee);

/* Logistics */
export const PickupIcon = make(MapPin);
export const DeliveryIcon = make(MapPin);
export const TrackingIcon = make(Navigation);
export const RouteMatchIcon = make(Route);

/**
 * Lucide ships no warehouse glyph. We intentionally avoid adding a Tabler
 * dependency (e.g. `BuildingWarehouse`) until a real in-app surface needs
 * one; `WarehouseIcon` maps to `Building2` as an outline placeholder.
 */
export const WarehouseIcon = make(Building2);
