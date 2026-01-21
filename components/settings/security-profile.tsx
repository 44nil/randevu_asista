"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Shield, Lock } from "lucide-react"

export function SecurityProfile() {
    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault()
        toast.info("Şifre değiştirme işlemi için Clerk profil yönetimine yönlendiriliyorsunuz...")
        // In real app: Redirect to Clerk user profile or use Clerk API
        setTimeout(() => {
            // window.location.href = "https://accounts.clerk.dev/user" // hypothetical
        }, 1000)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Güvenlik ve Profil
                </CardTitle>
                <CardDescription>
                    Hesap güvenliğinizi buradan yönetebilirsiniz.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mevcut Şifre</label>
                            <Input type="password" placeholder="••••••••" disabled />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Yeni Şifre</label>
                            <Input type="password" placeholder="••••••••" disabled />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Şifre Onayla</label>
                            <Input type="password" placeholder="••••••••" disabled />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button variant="outline" type="submit">
                            Şifreyi Değiştir (Clerk)
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
