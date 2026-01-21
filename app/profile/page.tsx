import { getUserProfile } from "@/app/profile-actions"
import { ProfileForm } from "@/components/profile/profile-form"
import { CustomerLayout } from "@/components/layout/customer-layout"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function ProfilePage() {
    const res = await getUserProfile()

    if (!res.success) {
        return <div className="p-8 text-center text-red-500">Profil yüklenemedi. Lütfen tekrar giriş yapın.</div>
    }

    const startContent = (
        <div className="space-y-6">
            {/* Header is now inside Profile Form or we can add a simple Title here if needed. 
                 Design showed "Profil Ayarları" header. 
             */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profil Ayarları</h1>
                <p className="text-slate-500 mt-2">Kişisel bilgilerinizi ve tercihlerinizi buradan yönetebilirsiniz.</p>
            </div>

            <ProfileForm user={res.data} />
        </div>
    )

    const role = res.data?.role

    if (role === 'customer') {
        return (
            <CustomerLayout>
                <div className="max-w-6xl mx-auto py-8 px-4">
                    {startContent}
                </div>
            </CustomerLayout>
        )
    }

    // Default to DashboardLayout for Admin/Staff
    return (
        <DashboardLayout title="Profil Ayarları">
            <div className="max-w-6xl mx-auto">
                {startContent}
            </div>
        </DashboardLayout>
    )
}
