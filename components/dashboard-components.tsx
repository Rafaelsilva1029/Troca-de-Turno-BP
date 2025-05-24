// components/dashboard-components.tsx

import type React from "react"

interface DashboardComponentProps {
  title: string
  content: React.ReactNode
}

const DashboardComponent: React.FC<DashboardComponentProps> = ({ title, content }) => {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div>{content}</div>
    </div>
  )
}

export default DashboardComponent
