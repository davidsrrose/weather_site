import { useEffect, useState } from "react"

import { fetchJson } from "@/api/client"
import { useGeocodeZip, useHourlyForecast } from "@/api/hooks"
import { AppShell } from "@/components/AppShell"
import { Dashboard } from "@/components/Dashboard"
import type { TimelineWindow } from "@/components/HourlyTimeline"

type LocationKind = "geo" | "favorite" | "zip"

type Location = {
  kind: LocationKind
  label: string
  lat: number
  lon: number
  zip?: string
}

type HealthState = "idle" | "loading" | "ok" | "error"

const FAVORITES_STORAGE_KEY = "weather_site_favorites"
const LAST_LOCATION_STORAGE_KEY = "weather_site_last_location"

const ZIP_REGEX = /^\d{5}$/

const DEFAULT_FAVORITES: Location[] = [
  { kind: "favorite", label: "Golden, CO", lat: 39.7555, lon: -105.2211 },
  { kind: "favorite", label: "Winter Park, CO", lat: 39.8917, lon: -105.7631 },
]

function loadStoredFavorites(): Location[] {
  if (typeof window === "undefined") {
    return DEFAULT_FAVORITES
  }

  const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
  if (!raw) {
    return DEFAULT_FAVORITES
  }

  try {
    const parsed = JSON.parse(raw) as Location[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_FAVORITES
    }
    return parsed
  } catch {
    return DEFAULT_FAVORITES
  }
}

function loadStoredLocation(): Location | null {
  if (typeof window === "undefined") {
    return null
  }

  const raw = window.localStorage.getItem(LAST_LOCATION_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Location
    if (
      !parsed ||
      typeof parsed.label !== "string" ||
      typeof parsed.lat !== "number" ||
      typeof parsed.lon !== "number" ||
      (parsed.kind !== "geo" && parsed.kind !== "favorite" && parsed.kind !== "zip")
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function App() {
  const [healthState, setHealthState] = useState<HealthState>("idle")
  const [healthMessage, setHealthMessage] = useState("Not checked yet.")

  const [favorites] = useState<Location[]>(() => loadStoredFavorites())
  const [currentLocation, setCurrentLocation] = useState<Location | null>(() =>
    loadStoredLocation()
  )
  const [locationStatus, setLocationStatus] = useState<string>(() => {
    const stored = loadStoredLocation()
    return stored
      ? `Using saved location: ${stored.label}.`
      : "Requesting location permission..."
  })
  const [showLocationControls, setShowLocationControls] = useState(false)

  const [zipInput, setZipInput] = useState("")
  const [zipMessage, setZipMessage] = useState("Enter a ZIP code to set location.")
  const [timelineWindow, setTimelineWindow] = useState<TimelineWindow | null>(null)

  const geocodeZip = useGeocodeZip()
  const hourlyForecast = useHourlyForecast(currentLocation?.lat, currentLocation?.lon)

  const checkHealth = async () => {
    setHealthState("loading")
    setHealthMessage("Checking /api/health ...")

    try {
      const data = await fetchJson<{ status?: string }>("/api/health")
      if (data.status !== "ok") {
        throw new Error("Unexpected health payload.")
      }

      setHealthState("ok")
      setHealthMessage("Backend is healthy: status=ok")
    } catch (error) {
      setHealthState("error")
      setHealthMessage(
        error instanceof Error ? error.message : "Unable to reach backend."
      )
    }
  }

  const applyLocation = (location: Location, statusMessage: string) => {
    setCurrentLocation(location)
    setLocationStatus(statusMessage)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        LAST_LOCATION_STORAGE_KEY,
        JSON.stringify(location)
      )
    }
  }

  const handleZipSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const zip = zipInput.trim()

    if (!ZIP_REGEX.test(zip)) {
      setZipMessage("ZIP must be exactly 5 digits.")
      return
    }

    setZipMessage(`Looking up ZIP ${zip}...`)

    try {
      const data = await geocodeZip.mutateAsync(zip)
      const location: Location = {
        kind: "zip",
        label: `${data.city}, ${data.state}`,
        lat: data.lat,
        lon: data.lon,
        zip: data.zip,
      }

      applyLocation(location, `ZIP set to ${data.zip} (${data.source}).`)
      setZipMessage(`Loaded ${data.city}, ${data.state} from ZIP ${data.zip}.`)
      setShowLocationControls(false)
    } catch (error) {
      setZipMessage(
        `ZIP lookup failed: ${error instanceof Error ? error.message : "unknown error"}`
      )
    }
  }

  const handleFavoriteChange = (label: string) => {
    const selectedFavorite = favorites.find((favorite) => favorite.label === label)
    if (!selectedFavorite) {
      return
    }

    applyLocation(selectedFavorite, `Using favorite: ${selectedFavorite.label}.`)
    setShowLocationControls(false)
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favorites)
      )
    }
  }, [favorites])

  useEffect(() => {
    void checkHealth()
  }, [])

  useEffect(() => {
    if (currentLocation) {
      return
    }

    if (!("geolocation" in navigator)) {
      applyLocation(favorites[0], "Geolocation unavailable. Using favorite location.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          kind: "geo",
          label: "Current Location",
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }
        applyLocation(location, "Using current browser location.")
      },
      () => {
        applyLocation(
          favorites[0],
          "Location not available. Defaulted to favorite location."
        )
      },
      { timeout: 10000 }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nowPeriod = hourlyForecast.data?.periods?.[0] ?? null
  const forecastPeriods = hourlyForecast.data?.periods ?? []
  const isForecastLoading = hourlyForecast.isLoading || hourlyForecast.isFetching
  const forecastErrorMessage = hourlyForecast.error?.message ?? "Unable to load forecast."
  const timelineWindowStartIndex = timelineWindow?.windowStartIndex ?? 0
  const timelineWindowSize = timelineWindow?.windowSize ?? 48

  return (
    <AppShell
      title="Weather Site"
      subtitle="Location-first weather dashboard optimized for mobile and desktop."
    >
      <Dashboard
        currentLocation={currentLocation}
        locationStatus={locationStatus}
        favorites={favorites}
        showLocationControls={showLocationControls}
        onToggleLocationControls={() => {
          setShowLocationControls((prev) => !prev)
        }}
        onFavoriteChange={handleFavoriteChange}
        zipInput={zipInput}
        onZipInputChange={setZipInput}
        onZipSubmit={handleZipSubmit}
        zipMessage={zipMessage}
        isZipLoading={geocodeZip.isPending}
        isZipError={geocodeZip.isError}
        onRefreshForecast={() => {
          void hourlyForecast.refetch()
        }}
        canRefreshForecast={Boolean(currentLocation)}
        isRefreshingForecast={hourlyForecast.isFetching}
        isForecastLoading={isForecastLoading}
        isForecastError={hourlyForecast.isError}
        forecastErrorMessage={forecastErrorMessage}
        periods={forecastPeriods}
        nowPeriod={nowPeriod}
        generatedAt={hourlyForecast.data?.generated_at ?? null}
        healthMessage={
          healthState === "ok"
            ? healthMessage
            : healthState === "loading"
              ? "Checking API health..."
              : healthMessage
        }
        timelineWindowStartIndex={timelineWindowStartIndex}
        timelineWindowSize={timelineWindowSize}
        onTimelineWindowChange={setTimelineWindow}
      />
    </AppShell>
  )
}

export default App
