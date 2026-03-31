export interface FRoad {
  number: string      // e.g. "F35"
  name: string
  nameIs: string
  openFrom: string    // e.g. "June" — typical opening month
  openTo: string      // e.g. "September"
  requires4WD: boolean
  highClearance: boolean
  region: string
}

export const FROADS: FRoad[] = [
  { number: 'F35',  name: 'Kjalvegur',              nameIs: 'Kjalvegur',              openFrom: 'June',   openTo: 'October',   requires4WD: true, highClearance: false, region: 'Central' },
  { number: 'F208', name: 'Fjallabak — South',       nameIs: 'Fjallabak — Suður',      openFrom: 'June',   openTo: 'September', requires4WD: true, highClearance: true,  region: 'South' },
  { number: 'F210', name: 'Fjallabak — North',       nameIs: 'Fjallabak — Norður',     openFrom: 'July',   openTo: 'September', requires4WD: true, highClearance: true,  region: 'South' },
  { number: 'F26',  name: 'Sprengisandur',           nameIs: 'Sprengisandur',          openFrom: 'July',   openTo: 'September', requires4WD: true, highClearance: true,  region: 'Central' },
  { number: 'F88',  name: 'Öskjuleið',               nameIs: 'Öskjuleið',              openFrom: 'July',   openTo: 'September', requires4WD: true, highClearance: true,  region: 'North' },
  { number: 'F910', name: 'Austurleið',              nameIs: 'Austurleið',             openFrom: 'July',   openTo: 'September', requires4WD: true, highClearance: true,  region: 'East' },
  { number: 'F249', name: 'Þórsmörk',                nameIs: 'Þórsmörk',               openFrom: 'May',    openTo: 'October',   requires4WD: true, highClearance: true,  region: 'South' },
  { number: 'F232', name: 'Öldufellsleið',           nameIs: 'Öldufellsleið',          openFrom: 'July',   openTo: 'September', requires4WD: true, highClearance: true,  region: 'South' },
  { number: 'F347', name: 'Kerlingarfjöll',          nameIs: 'Kerlingarfjöll',         openFrom: 'June',   openTo: 'September', requires4WD: true, highClearance: false, region: 'Central' },
  { number: 'F550', name: 'Kaldidalur',              nameIs: 'Kaldidalur',             openFrom: 'June',   openTo: 'October',   requires4WD: false, highClearance: false, region: 'West' },
  { number: 'F52',  name: 'Þjórsárver',              nameIs: 'Þjórsárver',             openFrom: 'July',   openTo: 'September', requires4WD: true, highClearance: true,  region: 'Central' },
  { number: 'F337', name: 'Þrengslabær',             nameIs: 'Þrengslabær',            openFrom: 'July',   openTo: 'September', requires4WD: true, highClearance: true,  region: 'Central' },
  { number: 'F821', name: 'Eyjafjarðarleið',         nameIs: 'Eyjafjarðarleið',        openFrom: 'July',   openTo: 'September', requires4WD: true, highClearance: false, region: 'North' },
  { number: 'F939', name: 'Öxnadalsheiði',           nameIs: 'Öxnadalsheiði',          openFrom: 'June',   openTo: 'October',   requires4WD: true, highClearance: false, region: 'North' },
]

const FROAD_NUMBERS = new Set(FROADS.map((f) => f.number))

export function isFRoad(roadNumber: string): boolean {
  if (!roadNumber) return false
  const upper = roadNumber.toUpperCase()
  if (FROAD_NUMBERS.has(upper)) return true
  // Generic: road numbers starting with F
  return /^F\d+/.test(upper)
}

export function getFRoadInfo(roadNumber: string): FRoad | undefined {
  return FROADS.find((f) => f.number === roadNumber.toUpperCase())
}
