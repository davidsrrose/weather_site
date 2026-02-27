export type GeocodeResponse = {
  zip: string
  lat: number
  lon: number
  city: string
  state: string
  source: "cache" | "upstream"
}

export type HourlyPeriod = {
  startTime: string
  temperature: number | null
  temperatureUnit: string | null
  shortForecast: string | null
  windSpeedMph: number | null
  windDirection: string | null
  probabilityOfPrecipitation: number | null
  relativeHumidity: number | null
  icon: string | null
}

export type HourlyResponse = {
  generated_at: string
  location: {
    lat: number
    lon: number
  }
  periods: HourlyPeriod[]
}
