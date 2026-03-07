import { SignIn } from "@clerk/nextjs";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function Page() {
    return (
        <div className="min-h-screen w-full flex">
            {/* Sol Taraf - Marka Alanı */}
            <div className="hidden lg:flex w-1/2 bg-zinc-900 relative items-center justify-center overflow-hidden">
                {/* Dekoratif Arka Plan Efektleri */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
                <div className="absolute right-0 bottom-0 -z-10 h-[310px] w-[310px] rounded-full bg-purple-500 opacity-20 blur-[100px]"></div>

                <div className="relative z-10 max-w-md px-10 text-white space-y-8">
                    <div className="space-y-4">
                        <Logo variant="dark" text="Randevu Asista" textClassName="text-4xl normal-case" iconClassName="w-12 h-12" />
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            İşletmenizi yönetmenin en modern yolu. Randevularınızı, müşterilerinizi ve ödemelerinizi tek bir yerden kontrol edin.
                        </p>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-3 text-zinc-300">
                            <div className="p-1 rounded-full bg-green-500/10 text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <span>Otomatik Randevu Hatırlatmaları</span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-300">
                            <div className="p-1 rounded-full bg-green-500/10 text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <span>Gelir ve Gider Takibi</span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-300">
                            <div className="p-1 rounded-full bg-green-500/10 text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <span>Müşteri Portalı ve Online Ödeme</span>
                        </div>
                    </div>

                    <div className="pt-8 flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-10 w-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400">
                                    U{i}
                                </div>
                            ))}
                        </div>
                        <div className="text-sm text-zinc-400">
                            <span className="text-white font-medium">1000+</span> işletme tarafından güveniliyor
                        </div>
                    </div>
                </div>
            </div>

            {/* Sağ Taraf - Giriş Formu */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    <div className="lg:hidden flex flex-col items-center text-center space-y-4 mb-8">
                        <Logo variant="light" text="Randevu Asista" textClassName="text-2xl normal-case" />
                        <p className="text-muted-foreground">Hesabınıza giriş yapın</p>
                    </div>

                    <div className="flex justify-center">
                        <SignIn
                            appearance={{
                                elements: {
                                    rootBox: "w-full",
                                    card: "shadow-none border-0 bg-transparent w-full p-0",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                    formButtonPrimary: "bg-zinc-900 hover:bg-zinc-800 text-white !shadow-none",
                                    footerActionLink: "text-zinc-600 hover:text-zinc-900",
                                    formFieldInput: "bg-background border-input focus:border-ring focus:ring-ring",
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
