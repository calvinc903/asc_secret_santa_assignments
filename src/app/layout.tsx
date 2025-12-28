import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Provider } from "@/components/ui/provider";
import CustomNavbar from "@/components/Navbar";
import { UserProvider } from "@/contexts/UserContext";

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

interface Session {
  user_id: string;
  name: string;
  expires: string;
}

export const metadata: Metadata = {
  title: "ASC Secret Santa",
  description: "Secret Santa for ASC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Provider>
          <UserProvider>
            <CustomNavbar />
            {children}
          </UserProvider>
        </Provider>
      </body>
    </html>
  );
}