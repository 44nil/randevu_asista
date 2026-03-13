import { ProgramClient } from "@/components/program/program-client"
import { getUserProfile } from "@/app/actions"
import { getWorkingHours } from "@/app/settings/actions"

export const dynamic = 'force-dynamic'

export default async function ProgramPage() {
    const [profile, workingHours] = await Promise.all([
        getUserProfile(),
        getWorkingHours()
    ])

    return <ProgramClient role={profile?.role} staffId={profile?.id} initialWorkingHours={workingHours} />
}
