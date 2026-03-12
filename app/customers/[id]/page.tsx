import { CustomerDetailClient } from "@/components/customers/customer-detail-client"
import { getCustomerDetail } from "@/app/customer-actions"
import { getUserProfile } from "@/app/actions"
import { notFound } from "next/navigation"

interface Props {
    params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: Props) {
    const { id } = await params
    const [profile, detailRes] = await Promise.all([
        getUserProfile(),
        getCustomerDetail(id)
    ])

    if (!detailRes.success || !detailRes.data) {
        notFound()
    }

    return (
        <CustomerDetailClient
            role={profile?.role}
            data={detailRes.data}
        />
    )
}
