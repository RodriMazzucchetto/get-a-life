import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Mono, IBM_Plex_Sans, Inter, Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { EnvCheck } from "@/components/EnvCheck";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Task Architect — Planejamento e tarefas",
  description:
    "Organize projetos, metas e tarefas com precisão. Gestão de produtividade para quem arquiteta o próprio tempo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body
        className={`${manrope.variable} ${inter.variable} ${geistMono.variable} ${ibmPlexMono.variable} ${ibmPlexSans.variable} font-body antialiased selection:bg-secondary-container selection:text-on-secondary-fixed`}
      >
        <EnvCheck>
          <AuthProvider>{children}</AuthProvider>
        </EnvCheck>
      </body>
    </html>
  );
}
