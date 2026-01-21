import { CustomersClient } from "@/components/customers/customers-client"
import { getUserProfile } from "@/app/actions"
import { getCustomersWithStats, getMemberPageStats } from "@/app/customer-actions"

export default async function CustomersPage() {
    const [profile, membersRes, statsRes] = await Promise.all([
        getUserProfile(),
        getCustomersWithStats(),
        getMemberPageStats()
    ])

    const role = profile?.role
    const members = membersRes.success ? membersRes.data : []
    const stats = statsRes.success ? statsRes.data : null

    return (
        <CustomersClient
            role={role}
            initialMembers={members}
            initialStats={stats}
        />
    )
}
