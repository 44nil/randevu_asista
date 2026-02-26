import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Randevu Sistemi",
  description: "SaaS Appointment System",
};

import { Toaster } from "@/components/ui/sonner"

import { getUserProfile } from "@/app/actions";
import { OrganizationProvider } from "@/providers/organization-provider";
import { AuthCheck } from "@/components/auth-check";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getUserProfile();

  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <OrganizationProvider
            organization={profile?.organization || null}
            user={profile ? { id: profile.id, role: profile.role, full_name: profile.full_name } : null}
          >
            <AuthCheck
              userId={profile?.clerk_id}
              hasOrganization={!!profile?.organization_id}
            />
            {children}
          </OrganizationProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
