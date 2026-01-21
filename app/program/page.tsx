import { ProgramClient } from "@/components/program/program-client"
import { getUserProfile } from "@/app/actions"

export default async function ProgramPage() {
    const profile = await getUserProfile()
    const role = profile?.role

    return <ProgramClient role={role} />
}
