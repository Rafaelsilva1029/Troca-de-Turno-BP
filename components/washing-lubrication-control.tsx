"use client"

import { WashingLubricationControl as WashingLubricationControlUpdated } from "./washing-lubrication-control-updated"

// Re-export with the same name for backward compatibility
export function WashingLubricationControl(props: any) {
  return <WashingLubricationControlUpdated {...props} />
}

export default WashingLubricationControl
