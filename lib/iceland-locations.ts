export interface IcelandLocation {
  name: string
  nameIs: string
  lat: number
  lon: number
  stationId?: string
  region: string
}

export const ICELAND_LOCATIONS: IcelandLocation[] = [
  { name: 'Reykjavík', nameIs: 'Reykjavík', lat: 64.1355, lon: -21.8954, stationId: '1', region: 'Southwest' },
  { name: 'Keflavík', nameIs: 'Keflavík', lat: 63.9850, lon: -22.5550, stationId: '422', region: 'Southwest' },
  { name: 'Selfoss', nameIs: 'Selfoss', lat: 63.9333, lon: -20.9967, stationId: '1475', region: 'South' },
  { name: 'Vík', nameIs: 'Vík', lat: 63.4189, lon: -19.0058, stationId: '1493', region: 'South' },
  { name: 'Höfn', nameIs: 'Höfn', lat: 64.2539, lon: -15.2086, stationId: '2642', region: 'East' },
  { name: 'Egilsstaðir', nameIs: 'Egilsstaðir', lat: 65.2706, lon: -14.3948, stationId: '3008', region: 'East' },
  { name: 'Akureyri', nameIs: 'Akureyri', lat: 65.6885, lon: -18.0956, stationId: '571', region: 'North' },
  { name: 'Mývatn', nameIs: 'Mývatn', lat: 65.5903, lon: -17.0059, stationId: '558', region: 'North' },
  { name: 'Húsavík', nameIs: 'Húsavík', lat: 66.0442, lon: -17.3398, stationId: '590', region: 'North' },
  { name: 'Siglufjörður', nameIs: 'Siglufjörður', lat: 66.1536, lon: -18.9136, stationId: '600', region: 'North' },
  { name: 'Ísafjörður', nameIs: 'Ísafjörður', lat: 66.0753, lon: -23.1350, stationId: '111', region: 'Westfjords' },
  { name: 'Stykkishólmur', nameIs: 'Stykkishólmur', lat: 65.0725, lon: -22.7303, stationId: '160', region: 'West' },
  { name: 'Borgarnes', nameIs: 'Borgarnes', lat: 64.5383, lon: -21.9186, stationId: '191', region: 'West' },
  { name: 'Hvolsvöllur', nameIs: 'Hvolsvöllur', lat: 63.7519, lon: -20.2283, region: 'South' },
  { name: 'Kirkjubæjarklaustur', nameIs: 'Kirkjubæjarklaustur', lat: 63.7861, lon: -18.0533, region: 'South' },
  { name: 'Gullfoss', nameIs: 'Gullfoss', lat: 64.3271, lon: -20.1207, region: 'South' },
  { name: 'Geysir', nameIs: 'Geysir', lat: 64.3097, lon: -20.3022, region: 'South' },
  { name: 'Þingvellir', nameIs: 'Þingvellir', lat: 64.2556, lon: -21.1300, region: 'Southwest' },
  { name: 'Hella', nameIs: 'Hella', lat: 63.8336, lon: -20.3886, region: 'South' },
  { name: 'Neskaupstaður', nameIs: 'Neskaupstaður', lat: 65.1456, lon: -13.6903, region: 'East' },
]

export const ICELAND_CENTER: [number, number] = [64.9, -18.1]
export const ICELAND_DEFAULT_ZOOM = 7

export function getLocationByName(name: string): IcelandLocation | undefined {
  return ICELAND_LOCATIONS.find(
    (l) => l.name.toLowerCase() === name.toLowerCase() || l.nameIs.toLowerCase() === name.toLowerCase()
  )
}
