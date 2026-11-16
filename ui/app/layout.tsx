import "./globals.css";
import RootWrapper from "@/wrappers/MainWrapper";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal"],
  variable: "--font-jakarta",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={` ${geist.variable} `}>
      <body className="min-h-full flex flex-col max-w-full overflow-x-clip">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <RootWrapper>{children}</RootWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
