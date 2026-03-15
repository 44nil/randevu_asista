"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { IndustryConfig } from '@/lib/config/industries'

interface DateTimeSelectionProps {
  selectedDate?: Date
  selectedTime?: string
  onDateTimeSelect: (date: Date, time: string) => void
  onBack: () => void
  config: IndustryConfig
}

export function DateTimeSelection({ 
  selectedDate, 
  selectedTime, 
  onDateTimeSelect, 
  onBack, 
  config 
}: DateTimeSelectionProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())
  const [currentTime, setCurrentTime] = useState(selectedTime)

  // Generate next 14 days
  const generateDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const date = new Date()
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  // Generate time slots (9 AM - 6 PM)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(timeString)
      }
    }
    return slots
  }

  const dates = generateDates()
  const timeSlots = generateTimeSlots()

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return 'Bugün'
    if (date.toDateString() === tomorrow.toDateString()) return 'Yarın'
    
    return date.toLocaleDateString('tr-TR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    })
  }

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date)
    setCurrentTime(undefined) // Reset time when date changes
  }

  const handleTimeSelect = (time: string) => {
    setCurrentTime(time)
  }

  const handleContinue = () => {
    if (currentDate && currentTime) {
      onDateTimeSelect(currentDate, currentTime)
    }
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString()
  }

  const canContinue = currentDate && currentTime

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
          Tarih ve Saat Seçin
        </h2>
        <p className="text-gray-600">
          {config.labels.session || 'Randevu'}nuz için uygun tarih ve saati seçin.
        </p>
      </div>

      {/* Date Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Tarih Seçin</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {dates.map((date, index) => {
            const isSelected = isSameDay(date, currentDate)
            const isToday = isSameDay(date, new Date())
            
            return (
              <button
                key={index}
                onClick={() => handleDateSelect(date)}
                className={`p-3 text-center rounded-lg border transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                  ${isToday ? 'ring-1 ring-blue-200' : ''}`}
              >
                <div className="text-sm font-medium">{formatDate(date)}</div>
                <div className="text-xs text-gray-500">{date.getDate()}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time Selection */}
      {currentDate && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium text-gray-900">Saat Seçin</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {timeSlots.map((time) => {
              const isSelected = time === currentTime
              
              return (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className={`p-2 text-center text-sm rounded-lg border transition-all
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-500 text-white' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  {time}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Devam Et Butonu */}
      {canContinue && (
        <div className="mt-6 pt-4 border-t">
          <Button
            onClick={handleContinue}
            className="w-full h-12"
          >
            Devam Et
          </Button>
        </div>
      )}
    </div>
  )
}