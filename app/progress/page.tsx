import { getUserProfile } from "@/app/profile-actions"
import { CustomerLayout } from "@/components/layout/customer-layout"
import { DevelopmentTracker } from "@/components/customers/development-tracker"
import { redirect } from "next/navigation"

export default async function ProgressPage() {
    const res = await getUserProfile()

    if (!res.success) {
        redirect("/sign-in")
    }

    if (res.data.role !== 'customer') {
        redirect("/")
    }

    return (
        <CustomerLayout>
            <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
                <DevelopmentTracker customerId={res.data.customer_id} />
            </div>
        </CustomerLayout>
    )
}
