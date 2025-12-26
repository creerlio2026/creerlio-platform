import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "Creerlio Platform",
  description: "AI Powered Talent and Business Platform",
  other: {
    "mobile-web-app-capable": "yes",
  },
};

// Initialize interceptors immediately (before any components load)
if (typeof window !== 'undefined') {
  // Import supabase to initialize fetch interceptor
  import('@/lib/supabase').catch(() => {});
}

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
