import type { Metadata, Viewport } from "next";
import ClientOnly from "@/components/ClientOnly";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "南极星 | CSU STAR",
  description: "中南大学一站式综合平台",
  icons: {
    icon: "/csustar.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link
          rel="stylesheet"
          href="https://unicons.iconscout.com/release/v3.0.6/css/line.css"
        />
        <link rel="preconnect" href="https://fonts.proxy.ustclug.org" />
        <link
          rel="stylesheet"
          href="https://fonts.proxy.ustclug.org/css2?family=Poppins:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <ClientOnly>{children}</ClientOnly>
      </body>
    </html>
  );
}
