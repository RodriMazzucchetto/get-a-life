export interface VisitedCity {
  id: string
  type: 'city'
  name: string
  displayName: string
  coordinates: [number, number]
  country: string
  state?: string
}

export interface CityLocation {
  type: 'city'
  name: string
  id: string
  coordinates: { lat: number, lon: number }
  country: string
  state?: string
}
