"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface InstructorStatsProps {
    data: { name: string, classes: number, hours: number }[]
}

export function InstructorStats({ data }: InstructorStatsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Eğitmen Performansı</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Eğitmen</TableHead>
                            <TableHead className="text-right">Verilen Ders</TableHead>
                            <TableHead className="text-right">Toplam Saat</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-slate-500">Kayıt bulunamadı.</TableCell>
                            </TableRow>
                        ) : (
                            data.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{item.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-slate-900">{item.name}</span>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-700">{item.classes}</TableCell>
                                    <TableCell className="text-right text-slate-500">{item.hours.toFixed(1)} Saat</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
