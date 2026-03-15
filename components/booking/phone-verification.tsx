"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Phone, Shield } from 'lucide-react'
import { IndustryConfig } from '@/lib/config/industries'

interface PhoneVerificationProps {
  onPhoneSubmit: (phone: string, otp: string) => void
  onBack: () => void
  config: IndustryConfig
  isLoading?: boolean
}

export function PhoneVerification({ 
  onPhoneSubmit, 
  onBack, 
  config,
  isLoading = false 
}: PhoneVerificationProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // Format as (5XX) XXX XX XX (11 digits)
    if (digits.length >= 11) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 11)}`
    }
    if (digits.length >= 8) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`
    }
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6)}`
    }
    if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    }
    return digits
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value)
    setPhone(formattedPhone)
  }

  const handleSendOtp = () => {
    // In a real implementation, this would call an API to send OTP
    console.log('Sending OTP to:', phone)
    setOtpSent(true)
    setStep('otp')
  }

  const handleVerifyOtp = () => {
    // Clean phone number for submission
    const cleanPhone = phone.replace(/\D/g, '')
    onPhoneSubmit(cleanPhone, otp)
  }

  const isPhoneValid = () => {
    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length === 11 && cleanPhone.startsWith('5')
  }

  const isOtpValid = () => {
    return otp.length === 6 && /^\d+$/.test(otp)
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 p-0 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri
        </Button>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Telefon Doğrulama
        </h2>
        <p className="text-gray-600">
          {config.labels.session || 'Randevu'}nuzu onaylamak için telefon numaranızı doğrulayın.
        </p>
      </div>

      {step === 'phone' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon Numarası
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                type="tel"
                placeholder="(5XX) XXX XX XX"
                value={phone}
                onChange={handlePhoneChange}
                className="pl-10"
                maxLength={17}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Türkiye cep telefonu formatında girin
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 text-sm">Güvenli Doğrulama</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Telefon numaranıza 6 haneli doğrulama kodu gönderilecek. 
                  Bu kod sadece randevu onayı için kullanılacak.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSendOtp}
            disabled={!isPhoneValid() || isLoading}
            className="w-full"
          >
            {isLoading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
          </Button>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Kod Gönderildi</h3>
            <p className="text-gray-600 text-sm">
              <span className="font-medium">{phone}</span> numarasına gönderilen 
              6 haneli doğrulama kodunu girin.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doğrulama Kodu
            </label>
            <Input
              type="text"
              placeholder="6 haneli kod"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-lg tracking-wider"
              maxLength={6}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep('phone')}
              className="flex-1"
            >
              Numarayı Değiştir
            </Button>
            <Button
              onClick={handleVerifyOtp}
              disabled={!isOtpValid() || isLoading}
              className="flex-1"
            >
              {isLoading ? 'Doğrulanıyor...' : 'Doğrula ve Devam Et'}
            </Button>
          </div>

          <button
            onClick={handleSendOtp}
            className="w-full text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Kodu tekrar gönder
          </button>
        </div>
      )}
    </div>
  )
}