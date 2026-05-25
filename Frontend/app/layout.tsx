import { Outfit } from "next/font/google";
import "./globals.css";
import { ToastContainer, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactQueryProviders from "@/utils/providers";
import type { Metadata } from "next";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: {
    default: "⬡ Deploy Dock",
    template: "%s | ⬡ Deploy Dock",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${outfit.className}`}>
      <body>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          transition={Flip}
        />
        <ReactQueryProviders>{children}</ReactQueryProviders>
      </body>
    </html>
  );
}
