import type React from "react"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  className?: string
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, icon, className = "" }) => {
  return (
    <div className={`bg-white shadow rounded-lg p-4 ${className}`}>
      <div className="flex items-center">
        {icon && <div className="mr-4">{icon}</div>}
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
      </div>
    </div>
  )
}

export default MetricCard
