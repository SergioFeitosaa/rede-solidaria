import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { HeaderNav, MobileTabBar } from "@/components/HeaderNav";
import { IconLogo } from "@/components/icons";

export const metadata: Metadata = {
  title: {
    default: "Rede Solidária Inteligente",
    template: "%s | Rede Solidária Inteligente"
  },
  description:
    "Conectando pessoas. Organizando a solidariedade. Reconstruindo comunidades. Plataforma de mobilização para a Região Metropolitana do Recife.",
  applicationName: "Rede Solidária Inteligente"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d6a56"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh">
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo principal
        </a>

        <header className="sticky top-0 z-40 border-b border-line/80 bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5 rounded-xl" aria-label="Rede Solidária Inteligente — início">
              <IconLogo size={34} className="text-brand-700" />
              <span className="leading-tight">
                <span className="block text-base font-extrabold tracking-tight text-ink">Rede Solidária</span>
                <span className="block text-2xs font-bold uppercase tracking-[0.14em] text-brand-700">
                  Inteligente
                </span>
              </span>
            </Link>
            <div className="hidden md:block">
              <HeaderNav />
            </div>
            <Link
              href="/solicitar-ajuda"
              className="inline-flex min-h-[40px] items-center rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-soft hover:bg-brand-800 md:hidden"
            >
              Pedir ajuda
            </Link>
          </div>
        </header>

        <main id="conteudo" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10 md:pb-14">
          {children}
        </main>

        <footer className="mt-6 border-t border-line bg-white">
          <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 text-sm text-muted sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-ink">Rede Solidária Inteligente</p>
              <p>Hackathon APONTI Academy · Desafio Antena na Lama · Caminho 3</p>
            </div>
            <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-alert">
              <span aria-hidden="true" className="font-bold">
                ⚠
              </span>
              <span>
                Este sistema <strong>não substitui</strong> a Defesa Civil, serviços de emergência ou organizações
                humanitárias. Em situação de risco, procure os canais oficiais.
              </span>
            </p>
            <p className="text-xs">
              Regiões reconhecidas com dados do{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                className="font-semibold underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                OpenStreetMap
              </a>{" "}
              © colaboradores (ODbL). Registros marcados como demonstração são fictícios. A IA sugere; a decisão é
              humana.
            </p>
          </div>
        </footer>

        <MobileTabBar />
      </body>
    </html>
  );
}
