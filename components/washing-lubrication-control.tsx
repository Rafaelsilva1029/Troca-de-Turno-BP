"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface WashingLubricationControlProps {
  initialWashingCycles: number
  initialLubricationCycles: number
  onWashingCyclesChange: (cycles: number) => void
  onLubricationCyclesChange: (cycles: number) => void
}

const WashingLubricationControl: React.FC<WashingLubricationControlProps> = ({
  initialWashingCycles,
  initialLubricationCycles,
  onWashingCyclesChange,
  onLubricationCyclesChange,
}) => {
  const [washingCycles, setWashingCycles] = useState(initialWashingCycles)
  const [lubricationCycles, setLubricationCycles] = useState(initialLubricationCycles)

  useEffect(() => {
    setWashingCycles(initialWashingCycles)
  }, [initialWashingCycles])

  useEffect(() => {
    setLubricationCycles(initialLubricationCycles)
  }, [initialLubricationCycles])

  const handleWashingCyclesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCycles = Number.parseInt(event.target.value, 10)
    setWashingCycles(newCycles)
    onWashingCyclesChange(newCycles)
  }

  const handleLubricationCyclesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCycles = Number.parseInt(event.target.value, 10)
    setLubricationCycles(newCycles)
    onLubricationCyclesChange(newCycles)
  }

  return (
    <div>
      <div>
        <label htmlFor="washingCycles">Washing Cycles:</label>
        <input type="number" id="washingCycles" value={washingCycles} onChange={handleWashingCyclesChange} />
      </div>
      <div>
        <label htmlFor="lubricationCycles">Lubrication Cycles:</label>
        <input
          type="number"
          id="lubricationCycles"
          value={lubricationCycles}
          onChange={handleLubricationCyclesChange}
        />
      </div>
    </div>
  )
}

export { WashingLubricationControl }
