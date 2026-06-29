export type AppNavItem = {
  name: string;
  href: string;
  icon: string;
  future?: boolean;
  active: (pathname: string) => boolean;
};

export const mainNav: AppNavItem[] = [
  {
    name: "Relatórios",
    href: "/os/reports",
    icon: "analytics",
    active: (pathname) => pathname === "/os/reports",
  },
  {
    name: "Pessoal",
    href: "/dashboard/problems",
    icon: "person",
    active: (pathname) => pathname === "/dashboard/problems",
  },
  {
    name: "OS",
    href: "/os",
    icon: "hub",
    active: (pathname) => pathname === "/os" || pathname === "/os/pitch",
  },
  {
    name: "Tasks OS",
    href: "/os/tasks",
    icon: "task_alt",
    active: (pathname) => pathname === "/os/tasks",
  },
];
