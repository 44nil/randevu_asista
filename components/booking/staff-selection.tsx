"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, ArrowLeft } from 'lucide-react'
import { IndustryConfig } from '@/lib/config/industries'

interface Staff {
  id: string
  full_name: string
}

interface StaffSelectionProps {
  staff: Staff[]
  selectedStaff?: Staff
  onSelect: (staff: Staff) => void
  onBack: () => void
  config: IndustryConfig
}

export function StaffSelection({ staff, selectedStaff, onSelect, onBack, config }: StaffSelectionProps) {
  const [selectedStaffMember, setSelectedStaffMember] = useState<Staff | undefined>(selectedStaff)

  const handleStaffSelect = (staffMember: Staff) => {
    setSelectedStaffMember(staffMember)
    // Auto-proceed when staff is selected
    onSelect(staffMember)
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
          {config.labels.instructor || 'Personel'} Seçin
        </h2>
        <p className="text-gray-600">
          Randevunuzu oluşturmak istediğiniz {config.labels.instructor?.toLowerCase() || 'personel'}i seçin.
        </p>
      </div>

      <div className="grid gap-4">
        {staff.map((staffMember) => {
          const isSelected = selectedStaffMember?.id === staffMember.id
          
          return (
            <div
              key={staffMember.id}
              onClick={() => handleStaffSelect(staffMember)}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {staffMember.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{staffMember.full_name}</h3>
                    <p className="text-sm text-gray-600">{config.labels.instructor || 'Personel'}</p>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}