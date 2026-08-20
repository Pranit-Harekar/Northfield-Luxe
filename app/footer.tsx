import Link from "next/link";

const FOOTER_SECTIONS: { title: string; links: string[] }[] = [
  {
    title: "Shop",
    links: ["New arrivals", "Best sellers", "Gift cards", "Sale"],
  },
  {
    title: "Support",
    links: ["Help center", "Shipping & delivery", "Returns & exchanges", "Track order", "Contact us"],
  },
  {
    title: "Company",
    links: ["About us", "Careers", "Press", "Sustainability"],
  },
  {
    title: "Legal",
    links: ["Privacy policy", "Terms of service", "Cookie policy", "Accessibility"],
  },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4">
        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold">{section.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {section.links.map((link) => (
                <li key={link}>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-6 text-xs text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} Northfield Luxe. All rights reserved.</span>
        <div className="flex flex-wrap gap-4">
          <Link href="#" className="hover:text-foreground">Privacy</Link>
          <Link href="#" className="hover:text-foreground">Terms</Link>
          <Link href="#" className="hover:text-foreground">Sitemap</Link>
        </div>
      </div>
    </footer>
  );
}
