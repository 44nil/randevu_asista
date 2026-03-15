"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { IndustryConfig } from '@/lib/config/industries'

interface Service {
  id: string
  name: string
  duration_minutes?: number
  duration?: number  // backward compatibility
  price?: number
  description?: string
}

interface ServiceSelectionProps {
  services: Service[]
  selectedServices: Service[]
  onSelect: (services: Service[]) => void
  config: IndustryConfig
}

export function ServiceSelection({ services, selectedServices, onSelect, config }: ServiceSelectionProps) {
  const [selected, setSelected] = useState<Service[]>(selectedServices || [])

  const toggleService = (service: Service) => {
    const newSelected = selected.some(s => s.id === service.id)
      ? selected.filter(s => s.id !== service.id)
      : [...selected, service]
    
    setSelected(newSelected)
  }

  const handleContinue = () => {
    onSelect(selected)
  }

  const totalPrice = selected.reduce((sum, service) => sum + (service.price || 0), 0)
  const selectedCount = selected.length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {config.labels.service || 'Hizmet'} Seçin
        </h2>
        <p className="text-gray-600">
          Almak istediğiniz {config.labels.service?.toLowerCase() || 'hizmet'}i seçin.
        </p>
      </div>

      <div className="grid gap-4">
        {services.map((service) => {
          const isSelected = selected.some(s => s.id === service.id)
          const duration = service.duration_minutes || service.duration || 0
          
          return (
            <div
              key={service.id}
              onClick={() => toggleService(service)}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900">{service.name}</h3>
                    {isSelected && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <span>{duration} dakika</span>
                    {service.price && (
                      <span className="font-medium">{service.price} ₺</span>
                    )}
                  </div>
                  
                  {service.description && (
                    <p className="mt-2 text-sm text-gray-600">{service.description}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedCount > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleContinue} className="px-8">
            Devam Et ({selectedCount} {config.labels.package?.toLowerCase() || 'hizmet'})
          </Button>
        </div>
      )}
    </div>
  )
}