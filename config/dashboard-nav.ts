import { LayoutDashboard, User, Sparkles, BarChart3, CreditCard, ShieldCheck, LineChart, Store, Calendar, Settings, UserPlus, type LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const dashboardNavSections: NavSection[] = [
  {
    label: "Main",
    items: [
      { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { title: "Edit Profile", href: "/dashboard/profile", icon: User },
    ],
  },
  {
    label: "Growth",
    items: [
      { title: "NIL Value", href: "/dashboard/nil", icon: LineChart },
      { title: "Marketplace", href: "/dashboard/marketplace", icon: Store },
      { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { title: "Referrals", href: "/dashboard/referrals", icon: UserPlus },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "AI Toolkit", href: "/dashboard/ai", icon: Sparkles },
      { title: "Scheduler", href: "/dashboard/schedule", icon: Calendar },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Compliance", href: "/dashboard/compliance", icon: ShieldCheck },
      { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export const dashboardNavItems: NavItem[] = dashboardNavSections.flatMap((s) => s.items);
