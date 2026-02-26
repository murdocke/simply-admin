import localFont from "next/font/local";

export const geistSans = localFont({
  src: [
    {
      path: "../public/fonts/Geist/Geist-VariableFont_wght.ttf",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

export const geistMono = localFont({
  src: [
    {
      path: "../public/fonts/Geist_Mono/GeistMono-VariableFont_wght.ttf",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export const spaceGrotesk = localFont({
  src: [
    {
      path: "../public/fonts/Space_Grotesk/SpaceGrotesk-VariableFont_wght.ttf",
      weight: "300 700",
      style: "normal",
    },
  ],
  display: "swap",
});
