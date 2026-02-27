import { useEffect, useState } from "react"

import { fetchJson } from "@/api/client"
import { useGeocodeZip, useHourlyForecast } from "@/api/hooks"
import type { HourlyPeriod } from "@/api/types"
import { AppShell } from "@/components/AppShell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
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

  const [zipInput, setZipInput] = useState("")
  const [zipMessage, setZipMessage] = useState("Enter a ZIP code to set location.")

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

  const forecastPeriods: HourlyPeriod[] = (hourlyForecast.data?.periods ?? []).slice(
    0,
    6
  )

  const forecastMessage = (() => {
    if (!currentLocation) {
      return "Select a location to load forecast."
    }
    if (hourlyForecast.isLoading || hourlyForecast.isFetching) {
      return `Loading forecast for ${currentLocation.label}...`
    }
    if (hourlyForecast.isError) {
      return hourlyForecast.error?.message ?? "Unable to load forecast."
    }
    if (forecastPeriods.length === 0) {
      return "No hourly forecast periods returned."
    }
    return `Loaded hourly forecast for ${currentLocation.label}.`
  })()

  const forecastMessageClass =
    hourlyForecast.isError
      ? "text-sm text-red-600"
      : hourlyForecast.isSuccess
        ? "text-sm text-emerald-600"
        : "text-sm text-muted-foreground"

  return (
    <AppShell
      title="Weather Site"
      subtitle="Location-first weather lookup for mobile-friendly use."
    >
      <Card>
        <CardHeader>
          <CardTitle>Location Setup</CardTitle>
          <CardDescription>
            Use geolocation, favorites, or ZIP lookup to choose your weather
            location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="location" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="location" className="space-y-4">
              <div className="rounded-md border p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Current location
                </p>
                <p className="mt-1 text-sm font-medium">
                  {currentLocation ? currentLocation.label : "Not set yet"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentLocation
                    ? formatCoords(currentLocation.lat, currentLocation.lon)
                    : "Waiting for geolocation or manual selection."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{locationStatus}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="favorite-location">
                  Favorite locations
                </label>
                <select
                  id="favorite-location"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  defaultValue=""
                  onChange={(event) => {
                    if (event.target.value) {
                      handleFavoriteChange(event.target.value)
                    }
                  }}
                >
                  <option value="">Select a favorite location</option>
                  {favorites.map((favorite) => (
                    <option key={favorite.label} value={favorite.label}>
                      {favorite.label}
                    </option>
                  ))}
                </select>
              </div>

              <form className="space-y-2" onSubmit={handleZipSubmit}>
                <label className="text-sm font-medium" htmlFor="zip-input">
                  ZIP code
                </label>
                <div className="flex gap-2">
                  <input
                    id="zip-input"
                    value={zipInput}
                    onChange={(event) => {
                      setZipInput(event.target.value)
                    }}
                    placeholder="e.g. 80401"
                    inputMode="numeric"
                    maxLength={5}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <Button disabled={geocodeZip.isPending} type="submit">
                    {geocodeZip.isPending ? "Looking..." : "Use ZIP"}
                  </Button>
                </div>
                <p
                  className={
                    geocodeZip.isError
                      ? "text-xs text-red-600"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {zipMessage}
                </p>
              </form>
            </TabsContent>

            <TabsContent value="forecast" className="space-y-3">
              <p className={forecastMessageClass}>{forecastMessage}</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void hourlyForecast.refetch()
                }}
                disabled={!currentLocation || hourlyForecast.isFetching}
              >
                {hourlyForecast.isFetching ? "Refreshing..." : "Refresh Forecast"}
              </Button>
              {forecastPeriods.length > 0 ? (
                <ul className="space-y-2">
                  {forecastPeriods.map((period, index) => (
                    <li
                      key={`${period.startTime}-${index}`}
                      className="rounded-md border p-3"
                    >
                      <p className="text-sm font-medium">
                        {new Date(period.startTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {period.temperature ?? "--"}
                        {period.temperatureUnit ?? ""} - {period.shortForecast ?? "N/A"}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </TabsContent>

            <TabsContent value="system" className="space-y-3">
              <p
                className={
                  healthState === "ok"
                    ? "text-sm font-medium text-emerald-600"
                    : healthState === "error"
                      ? "text-sm font-medium text-red-600"
                      : "text-sm text-muted-foreground"
                }
              >
                {healthMessage}
              </p>
              <Button
                onClick={() => {
                  void checkHealth()
                }}
                variant={healthState === "ok" ? "secondary" : "default"}
              >
                {healthState === "loading" ? "Checking..." : "Check API Health"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-between text-xs text-muted-foreground">
          <p>Favorites are persisted in localStorage.</p>
          <p>Last selected location is saved after refresh.</p>
        </CardFooter>
      </Card>
    </AppShell>
  )
}

export default App
