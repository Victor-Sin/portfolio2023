import localFont from 'next/font/local'
import "@/app/globals.css";
import LayoutBody from "@/components/LayoutBody";
import { NavigationProvider } from "@/contexts/NavigationContext";

export const metadata = {
  title: {
    default: "Victor Sin — Creative Developer",
    template: "%s | Victor Sin",
  },
  description: "Victor Sin is a creative developer based in Paris, crafting immersive WebGL & WebGPU experiences, interactive installations, and expressive web interfaces.",
  keywords: ["creative developer", "WebGL", "WebGPU", "Three.js", "interactive", "Paris", "portfolio", "Victor Sin"],
  authors: [{ name: "Victor Sin" }],
  creator: "Victor Sin",
  metadataBase: new URL("https://portfolio2023-git-master-victorsins-projects.vercel.app/"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Victor Sin — Creative Developer",
    title: "Victor Sin — Creative Developer",
    description: "Immersive WebGL & WebGPU experiences, interactive installations, and expressive web interfaces.",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@victor_sin_",
    title: "Victor Sin — Creative Developer",
    description: "Immersive WebGL & WebGPU experiences, interactive installations, and expressive web interfaces.",
  },
  robots: {
    index: true,
    follow: true,
  },
};


const parasitype = localFont({
  variable: "--font-parasitype",
  preload: false,
  src: [
    {
      path: "../../public/fonts/parasitype/Parasitype-ExtraLight.otf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/parasitype/Parasitype-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/parasitype/Parasitype-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/parasitype/Parasitype-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/parasitype/Parasitype-SemiBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/parasitype/Parasitype-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
});

const courierNew = localFont({
  variable: "--font-courier-new",
  preload: false,
  src: [
    {
        path: "../../public/fonts/courierNew/CourierNewPSMT.ttf",
        weight: "400",
        style: "normal",
      },
      {
        path: "../../public/fonts/courierNew/CourierNewPS-ItalicMT.ttf",
        weight: "400",
        style: "italic",
      },
      {
        path: "../../public/fonts/courierNew/CourierNewPS-BoldMT.ttf",
        weight: "700",
        style: "normal",
      },
      {
        path: "../../public/fonts/courierNew/CourierNewPS-BoldItalicMT.ttf",
        weight: "700",
        style: "italic",
      },
  ],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${parasitype.variable} ${courierNew.variable}`}>
        <NavigationProvider>
          <LayoutBody>{children}</LayoutBody>
        </NavigationProvider>
      </body>
    </html>
  );
}
