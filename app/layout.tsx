import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import FeedbackToaster from "@/components/ui/FeedbackToaster";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const dynamic = "force-static";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "南极星(中南指北)",
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdmirror.com/npm/@iconscout/unicons@3.0.6/css/line.css"
        />
      </head>
      <body className={poppins.className}>
        {children}
        <FeedbackToaster />
      </body>
    </html>
  );
}
