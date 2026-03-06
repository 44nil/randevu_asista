'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthCheck({
    hasOrganization,
    userId
}: {
    hasOrganization: boolean;
    userId: string | null | undefined;
}) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!userId) return; // Oturum açmamışsa karışma

        const isOnboardingPage = pathname?.startsWith('/onboarding');

        // Eğer organizasyonu YOKSA ve onboarding sayfasında değilse
        if (!hasOrganization && !isOnboardingPage) {
            router.push('/onboarding');
        }

        // Eğer organizasyonu VARSA ve onboarding sayfasındaysa
        if (hasOrganization && isOnboardingPage) {
            router.push('/');
        }
    }, [hasOrganization, userId, pathname, router]);

    return null;
}
