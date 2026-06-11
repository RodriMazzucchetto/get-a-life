export type AppNavItem = {
  name: string;
  href: string;
  icon: string;
  future?: boolean;
  active: (pathname: string) => boolean;
};

export const mainNav: AppNavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "grid_view",
    active: (pathname) => pathname === "/dashboard",
  },
  {
    name: "Metas",
    href: "/dashboard/goals",
    icon: "ads_click",
    active: (pathname) => pathname === "/dashboard/goals",
  },
  {
    name: "Tarefas",
    href: "/dashboard/planning",
    icon: "checklist",
    active: (pathname) => pathname === "/dashboard/planning",
  },
  {
    name: "Problemas",
    href: "/dashboard/problems",
    icon: "error_outline",
    active: (pathname) => pathname === "/dashboard/problems",
  },
  {
    name: "OS",
    href: "/os",
    icon: "hub",
    active: (pathname) => pathname.startsWith("/os"),
  },
  {
    name: "Relatórios",
    href: "#",
    icon: "analytics",
    future: true,
    active: () => false,
  },
];
