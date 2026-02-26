import type { Metadata } from "next";
import "./globals.css";
import ThemeInitializer from "./components/theme-initializer";
import { geistMono, geistSans } from "./fonts";

export const metadata: Metadata = {
  title: "Simply Music",
  description: "Simply Music Admin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('sm_theme');if(t){document.documentElement.dataset.theme=t;}}catch(e){}",
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
