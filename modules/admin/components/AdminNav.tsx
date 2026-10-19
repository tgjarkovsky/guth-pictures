"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const groups = [
  { title: "Web", tabs: [
    { href: "/admin/obsah", label: "Texty" },
    { href: "/admin/fotky", label: "Fotky" },
    { href: "/admin/tema", label: "Téma" },
  ] },
  { title: "Klienti", tabs: [
    { href: "/admin/galerie", label: "Galerie" },
    { href: "/admin/navrhy", label: "Návrhy" },
  ] },
  { title: "Publikace", tabs: [
    { href: "/admin/blog", label: "Blog" },
    { href: "/admin/stories", label: "Stories" },
  ] },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-3">
      {groups.map(({ title, tabs }) => (
        <div key={title} className="flex items-center gap-1">
          <span className="mr-1 text-[11px] uppercase tracking-wider text-gray-500">{title}</span>
          {tabs.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white border border-white/10 hover:border-white/30"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
