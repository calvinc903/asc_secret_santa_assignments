import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Provider } from "@/components/ui/provider";
import CustomNavbar from "@/components/Navbar";
import { SessionProvider } from "next-auth/react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ASC Secret Santa 2024",
  description: "Secret Santa 2024 for ASC",
};

export default function RootLayout({ children, pageProps = {} }: { children: React.ReactNode, pageProps?: { session?: any } }) {
  return (
    <html lang="en" className='dark' suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider session={pageProps.session}>
          <Provider>
            <CustomNavbar />
            {children}
          </Provider>
        </SessionProvider>
      </body>
    </html>
  );
}
