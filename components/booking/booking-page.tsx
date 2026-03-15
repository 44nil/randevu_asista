"use client"

import { useState } from 'react'
import { getIndustryConfig } from '@/lib/config/industries'
import { ServiceSelection } from './service-selection'
import { StaffSelection } from './staff-selection'
import { DateTimeSelection } from './datetime-selection'
import { PhoneVerification } from './phone-verification'
import { BookingConfirmation } from './booking-confirmation'

interface Business {
  id: string
  name: string
  industry_type: string
  settings?: any
  lunch_break_enabled?: boolean
  lunch_break_start?: string
  lunch_break_end?: string
}

interface Service {
  id: string
  name: string
  duration_minutes?: number
  duration?: number  // backward compatibility
  price?: number
  description?: string
}

interface Staff {
  id: string
  full_name: string
}

interface BookingData {
  services: Service[]
  staff?: Staff
  date?: Date
  time?: string
  phone?: string
  customerName?: string
}

interface BookingPageProps {
  business: Business
  services: Service[]
  staff: Staff[]
}

type BookingStep = 'services' | 'staff' | 'datetime' | 'phone' | 'confirmation'

export function BookingPage({ business, services, staff }: BookingPageProps) {
  const [step, setStep] = useState<BookingStep>('services')
  const [bookingData, setBookingData] = useState<BookingData>({
    services: []
  })

  const config = getIndustryConfig(business.settings?.real_industry || business.industry_type)

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }))
  }

  const goToNextStep = () => {
    switch (step) {
      case 'services':
        setStep(staff.length > 1 ? 'staff' : 'datetime')
        break
      case 'staff':
        setStep('datetime')
        break
      case 'datetime':
        setStep('phone')
        break
      case 'phone':
        setStep('confirmation')
        break
    }
  }

  const goToPrevStep = () => {
    switch (step) {
      case 'staff':
        setStep('services')
        break
      case 'datetime':
        setStep(staff.length > 1 ? 'staff' : 'services')
        break
      case 'phone':
        setStep('datetime')
        break
      case 'confirmation':
        setStep('phone')
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
          <p className="text-gray-600 mt-1">
            {config.labels.appointment} Rezervasyonu
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          {['services', 'staff', 'datetime', 'phone', 'confirmation'].map((stepName, index) => {
            const stepLabels = {
              services: config.labels.package || 'Hizmet',
              staff: config.labels.instructor || 'Personel', 
              datetime: 'Tarih & Saat',
              phone: 'İletişim',
              confirmation: 'Onay'
            }
            
            // Skip staff step if only one staff member
            if (stepName === 'staff' && staff.length <= 1) return null
            
            const isActive = step === stepName
            const isCompleted = ['services', 'staff', 'datetime', 'phone', 'confirmation'].indexOf(stepName) < 
                               ['services', 'staff', 'datetime', 'phone', 'confirmation'].indexOf(step)
            
            return (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${isActive ? 'bg-blue-600 text-white' : 
                    isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium
                  ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                  {stepLabels[stepName as keyof typeof stepLabels]}
                </span>
                {index < 4 && staff.length > 1 && (
                  <div className={`w-12 h-0.5 mx-4 
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {step === 'services' && (
            <ServiceSelection
              services={services}
              selectedServices={bookingData.services}
              onSelect={(selectedServices) => {
                updateBookingData({ services: selectedServices })
                if (selectedServices.length > 0) {
                  goToNextStep()
                }
              }}
              config={config}
            />
          )}

          {step === 'staff' && (
            <StaffSelection
              staff={staff}
              selectedStaff={bookingData.staff}
              onSelect={(selectedStaff) => {
                updateBookingData({ staff: selectedStaff })
                goToNextStep()
              }}
              onBack={goToPrevStep}
              config={config}
            />
          )}

          {step === 'datetime' && (
            <DateTimeSelection
              selectedDate={bookingData.date}
              selectedTime={bookingData.time}
              onDateTimeSelect={(date, time) => {
                updateBookingData({ date, time })
                goToNextStep()
              }}
              onBack={goToPrevStep}
              config={config}
            />
          )}

          {step === 'phone' && (
            <PhoneVerification
              onPhoneSubmit={(phone, otp) => {
                // In real implementation, verify OTP then proceed
                updateBookingData({ phone })
                goToNextStep()
              }}
              onBack={goToPrevStep}
              config={config}
            />
          )}

          {step === 'confirmation' && bookingData.services.length > 0 && bookingData.staff && bookingData.date && bookingData.time && bookingData.phone && (
            <BookingConfirmation
              bookingData={{
                services: bookingData.services,
                staff: bookingData.staff,
                date: bookingData.date,
                time: bookingData.time,
                phone: bookingData.phone
              }}
              onConfirm={() => {
                // TODO: Create appointment in database
                console.log('Creating appointment:', bookingData)
              }}
              onEdit={(stepIndex) => {
                const steps: BookingStep[] = ['services', 'staff', 'datetime', 'phone']
                setStep(steps[stepIndex] || 'services')
              }}
              config={config}
            />
          )}
        </div>
      </div>
    </div>
  )
}