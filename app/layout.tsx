import type {Metadata, Viewport} from "next";
import {Poppins} from "next/font/google";
import AuthBootstrap from "@/components/auth/AuthBootstrap";
import NotificationBootstrap from "@/components/auth/NotificationBootstrap";
import FeedbackToaster from "@/components/ui/FeedbackToaster";
import TDesignProvider from "@/components/ui/TDesignProvider";
import {getAuthPrepaintScript} from "@/lib/authPrepaint";
/* TDesign styles first; site globals load after so project utilities can override. */
import "tdesign-react/es/style/index.css";
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
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "南极星 | CSU Star",
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
        {/* Restore nav login/avatar chrome before first paint (avoids refresh jitter). */}
        <script
          dangerouslySetInnerHTML={{ __html: getAuthPrepaintScript() }}
        />
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
      <TDesignProvider>
        <AuthBootstrap/>
        <NotificationBootstrap/>
        {children}
        <FeedbackToaster/>
      </TDesignProvider>
      </body>
      </html>
  );
}
