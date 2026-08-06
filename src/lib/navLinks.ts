export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/input", label: "入力" },
  { href: "/settlement", label: "精算" },
  { href: "/expenses", label: "分析" },
  { href: "/fixed-costs", label: "固定費" },
];
