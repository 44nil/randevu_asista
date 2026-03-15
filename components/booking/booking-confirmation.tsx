"use client"

import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, Clock, User, Phone, ArrowRight } from 'lucide-react'
import { IndustryConfig } from '@/lib/config/industries'

interface Service {
  id: string
  name: string
  price?: number
  duration_minutes?: number
  duration?: number  // backward compatibility
}

interface Staff {
  id: string
  full_name: string
}

interface BookingData {
  services: Service[]
  staff: Staff
  date: Date
  time: string
  phone: string
}

interface BookingConfirmationProps {
  bookingData: BookingData
  onConfirm: () => void
  onEdit: (step: number) => void
  config: IndustryConfig
  isLoading?: boolean
}

export function BookingConfirmation({ 
  bookingData, 
  onConfirm, 
  onEdit, 
  config,
  isLoading = false 
}: BookingConfirmationProps) {
  const totalPrice = bookingData.services.reduce((sum, service) => sum + (service.price || 0), 0)
  const totalDuration = bookingData.services.reduce((sum, service) => sum + (service.duration_minutes || service.duration || 0), 0)
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatPhone = (phone: string) => {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)} ${phone.slice(6, 8)} ${phone.slice(8, 11)}`
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {config.labels.session || 'Randevu'} Özeti
        </h2>
        <p className="text-gray-600">
          Bilgilerinizi kontrol edin ve {config.labels.session?.toLowerCase() || 'randevu'}nuzu onaylayın.
        </p>
      </div>

      {/* Services */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            {config.labels.service || 'Hizmet'}ler
          </h3>
          <button
            onClick={() => onEdit(0)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Düzenle
          </button>
        </div>
        <div className="space-y-2">
          {bookingData.services.map((service) => (
            <div key={service.id} className="flex justify-between text-sm">
              <span>{service.name}</span>
              <span className="font-medium">{service.price || 0}₺</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-2 flex justify-between font-medium">
          <span>Toplam</span>
          <span>{totalPrice}₺</span>
        </div>
      </div>

      {/* Staff */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">
            {config.labels.instructor || 'Personel'}
          </h3>
          <button
            onClick={() => onEdit(1)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Düzenle
          </button>
        </div>
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-gray-500" />
          <span className="text-sm">{bookingData.staff.full_name}</span>
        </div>
      </div>

      {/* Date & Time */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">Tarih ve Saat</h3>
          <button
            onClick={() => onEdit(2)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Düzenle
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span>{formatDate(bookingData.date)}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-5 h-5 text-gray-500" />
            <span>{bookingData.time} ({totalDuration} dakika)</span>
          </div>
        </div>
      </div>

      {/* Phone */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">İletişim</h3>
          <button
            onClick={() => onEdit(3)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Düzenle
          </button>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Phone className="w-5 h-5 text-gray-500" />
          <span>{formatPhone(bookingData.phone)}</span>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 text-sm mb-2">Önemli Bilgiler</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• {config.labels.session || 'Randevu'}nuz onaylandığında SMS ile bilgilendirileceksiniz</li>
          <li>• İptal için randevu saatinden en az 24 saat önce bildirim yapın</li>
          <li>• Geç kalma durumunda {config.labels.session?.toLowerCase() || 'randevu'} süresi kısalabilir</li>
        </ul>
      </div>

      <Button
        onClick={onConfirm}
        disabled={isLoading}
        className="w-full h-12 text-base"
      >
        {isLoading ? (
          'Onaylanıyor...'
        ) : (
          <>
            {config.labels.session || 'Randevu'}yu Onayla
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>
    </div>
  )
}