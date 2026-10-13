import { OfficeShell } from './OfficeShell'
import { Ceiling } from './Ceiling'
import { ReceptionArea } from './ReceptionArea'
import { Benches, CabinDesks, EatingArea, Monitors, OfficeChairs, PlanterWorkstation } from './OfficeFurniture'
import { GlobalLighting } from './Lights'
import { Plant } from './Plant'
import { POTTED_PLANTS } from './placements'

/** The complete Spacewire Tech office, generated from src/config/office.ts. */
export function Office() {
  return (
    <group>
      <GlobalLighting />
      <OfficeShell />
      <Ceiling />
      <ReceptionArea />
      <CabinDesks />
      <Benches />
      <PlanterWorkstation />
      <EatingArea />
      <OfficeChairs />
      <Monitors />
      {POTTED_PLANTS.map((p, i) => (
        <Plant key={i} kind={p.kind} position={[p.x, 0, p.z]} scale={0.9} seed={20 + i} />
      ))}
    </group>
  )
}
