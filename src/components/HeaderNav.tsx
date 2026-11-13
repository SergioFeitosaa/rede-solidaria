"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconCards,
  IconHandHeart,
  IconHeart,
  IconHome,
  IconList,
  IconLock
} from "./icons";
import { cn } from "./ui";

/** Navegação principal. Estado ativo derivado da rota — sem "link cego". */
const NAV = [
  { href: "/", label: "Início", icon: IconHome },
  { href: "/solicitar-ajuda", label: "Preciso de ajuda", icon: IconHandHeart },
  { href: "/oferecer-ajuda", label: "Quero ajudar", icon: IconHeart },
  { href: "/match", label: "Match", icon: IconCards },
  { href: "/meus-pedidos", label: "Meus pedidos", icon: IconList }
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav() {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1">
      {NAV.slice(1).map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-[40px] items-center rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                active ? "bg-brand-50 text-brand-800" : "text-ink/75 hover:bg-canvas hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
      <li>
        <Link
          href="/central"
          aria-current={isActive(pathname, "/central") ? "page" : undefined}
          className={cn(
            "inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
            isActive(pathname, "/central")
              ? "border-brand-700 bg-brand-700 text-white"
              : "border-line text-ink/80 hover:border-brand-300 hover:text-brand-800"
          )}
        >
          <IconLock size={15} />
          Central
        </Link>
      </li>
    </ul>
  );
}

/** Barra inferior no celular — o caminho curto entre "pedir", "ajudar" e "match". */
export function MobileTabBar() {
  const pathname = usePathname();
  const items = [
    NAV[0],
    NAV[1],
    NAV[2],
    NAV[3],
    { href: "/central", label: "Central", icon: IconLock }
  ];
  return (
    <nav
      aria-label="Navegação rápida"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-2xs font-bold transition-colors",
                  active ? "text-brand-700" : "text-muted"
                )}
              >
                <Icon size={21} />
                {item.label}
                <span
                  aria-hidden="true"
                  className={cn("h-0.5 w-6 rounded-full", active ? "bg-brand-700" : "bg-transparent")}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
