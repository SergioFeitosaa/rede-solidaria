import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

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

const NAV = [
  { href: "/", label: "Início" },
  { href: "/solicitar-ajuda", label: "Solicitar ajuda" },
  { href: "/oferecer-ajuda", label: "Oferecer ajuda" },
  { href: "/match", label: "Match Solidário" },
  { href: "/central", label: "Central" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo principal
        </a>
        <header className="sticky top-0 z-40 border-b border-brand-800/20 bg-brand-800 text-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="text-lg font-bold leading-tight">
              Rede Solidária
              <span className="block text-xs font-normal text-brand-100">Inteligente</span>
            </Link>
            <nav aria-label="Navegação principal">
              <ul className="flex flex-wrap items-center gap-1 sm:gap-2">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-lg px-2.5 py-2 text-sm font-semibold text-white hover:bg-brand-700 sm:px-3 sm:text-base"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        <main id="conteudo" className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
          {children}
        </main>

        <footer className="mt-10 border-t border-ink/10 bg-white">
          <div className="mx-auto max-w-5xl space-y-3 px-4 py-8 text-sm text-ink/70">
            <p className="font-semibold text-ink">
              Rede Solidária Inteligente — Conectando pessoas. Organizando a solidariedade. Reconstruindo
              comunidades.
            </p>
            <p>
              ⚠️ Este sistema <strong>não substitui</strong> a Defesa Civil, serviços de emergência ou
              organizações humanitárias. Em situação de risco, procure os canais oficiais de emergência.
            </p>
            <p>
              Regiões reconhecidas com dados do{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                OpenStreetMap
              </a>{" "}
              © colaboradores (licença ODbL). Registros marcados como demonstração são fictícios.
            </p>
            <p>Projeto do Hackathon APONTI Academy: Devs Criam com IA — Desafio Antena na Lama, Caminho 3.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
