import { ProgramClient } from "@/components/program/program-client"
import { getUserProfile } from "@/app/actions"

export default async function ProgramPage() {
    const profile = await getUserProfile()
    const role = profile?.role
    const staffId = profile?.id  // Supabase UUID (clerk_id değil)

    return <ProgramClient role={role} staffId={staffId} />
}
