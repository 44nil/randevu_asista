import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
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
import { auth } from '@clerk/nextjs/server';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userId = null;
  let profile = null;

  try {
    const authObj = await auth();
    userId = authObj.userId;
    if (userId) {
      profile = await getUserProfile();
    }
  } catch (error) {
    // Clerk throws if middleware wasn't run. This happens when Next.js renders the 404 page for a missing static asset (like favicon.ico), which bypasses middleware.
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${plusJakartaSans.variable} font-sans antialiased bg-[#E6ECF8]`}
        >
          <OrganizationProvider
            organization={profile?.organization || null}
            user={profile ? { id: profile.id, role: profile.role, full_name: profile.full_name } : null}
          >
            <AuthCheck
              userId={userId || profile?.clerk_id}
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
