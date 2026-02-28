import type { FormEvent } from "react"

import type { HourlyPeriod } from "@/api/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type DashboardLocation = {
  label: string
  lat: number
  lon: number
}

type DashboardProps = {
  currentLocation: DashboardLocation | null
  locationStatus: string
  favorites: DashboardLocation[]
  showLocationControls: boolean
  onToggleLocationControls: () => void
  onFavoriteChange: (label: string) => void
  zipInput: string
  onZipInputChange: (value: string) => void
  onZipSubmit: (event: FormEvent<HTMLFormElement>) => void
  zipMessage: string
  isZipLoading: boolean
  isZipError: boolean
  onRefreshForecast: () => void
  canRefreshForecast: boolean
  isRefreshingForecast: boolean
  isForecastLoading: boolean
  isForecastError: boolean
  forecastErrorMessage: string
  nowPeriod: HourlyPeriod | null
  generatedAt: string | null
  healthMessage: string
}

function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
}

function renderNowPrimary(
  isForecastLoading: boolean,
  isForecastError: boolean,
  forecastErrorMessage: string,
  nowPeriod: HourlyPeriod | null
) {
  if (isForecastLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 w-28 rounded bg-muted" />
        <div className="h-4 w-40 rounded bg-muted" />
      </div>
    )
  }

  if (isForecastError) {
    return <p className="text-sm text-red-600">{forecastErrorMessage}</p>
  }

  if (!nowPeriod) {
    return <p className="text-sm text-muted-foreground">No current period available.</p>
  }

  return (
    <div className="space-y-1">
      <p className="text-5xl font-semibold tracking-tight">
        {nowPeriod.temperature ?? "--"}
        {nowPeriod.temperatureUnit ?? ""}
      </p>
      <p className="text-sm text-muted-foreground">
        {nowPeriod.shortForecast ?? "Forecast unavailable"}
      </p>
    </div>
  )
}

function renderNowSecondary(
  isForecastLoading: boolean,
  isForecastError: boolean,
  nowPeriod: HourlyPeriod | null
) {
  if (isForecastLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-24 rounded bg-muted" />
        <div className="h-6 w-20 rounded bg-muted" />
      </div>
    )
  }

  if (isForecastError || !nowPeriod) {
    return <p className="text-sm text-muted-foreground">No weather details available.</p>
  }

  const windText =
    nowPeriod.windSpeedMph !== null
      ? `${nowPeriod.windSpeedMph} mph ${nowPeriod.windDirection ?? ""}`.trim()
      : "--"

  const precipText =
    nowPeriod.probabilityOfPrecipitation !== null
      ? `${nowPeriod.probabilityOfPrecipitation}%`
      : "--"

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Wind</span>
        <span className="font-medium">{windText}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Precip</span>
        <span className="font-medium">{precipText}</span>
      </div>
    </div>
  )
}

export function Dashboard({
  currentLocation,
  locationStatus,
  favorites,
  showLocationControls,
  onToggleLocationControls,
  onFavoriteChange,
  zipInput,
  onZipInputChange,
  onZipSubmit,
  zipMessage,
  isZipLoading,
  isZipError,
  onRefreshForecast,
  canRefreshForecast,
  isRefreshingForecast,
  isForecastLoading,
  isForecastError,
  forecastErrorMessage,
  nowPeriod,
  generatedAt,
  healthMessage,
}: DashboardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-w-0 flex-1 justify-start"
          onClick={onToggleLocationControls}
        >
          <span className="truncate">
            {currentLocation ? currentLocation.label : "Select location"}
          </span>
        </Button>
        <Button
          type="button"
          onClick={onRefreshForecast}
          disabled={!canRefreshForecast || isRefreshingForecast}
        >
          {isRefreshingForecast ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {showLocationControls ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
            <CardDescription>{locationStatus}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    onFavoriteChange(event.target.value)
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

            <form className="space-y-2" onSubmit={onZipSubmit}>
              <label className="text-sm font-medium" htmlFor="zip-input">
                ZIP code
              </label>
              <div className="flex gap-2">
                <input
                  id="zip-input"
                  value={zipInput}
                  onChange={(event) => {
                    onZipInputChange(event.target.value)
                  }}
                  placeholder="e.g. 80401"
                  inputMode="numeric"
                  maxLength={5}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
                <Button disabled={isZipLoading} type="submit">
                  {isZipLoading ? "Looking..." : "Use ZIP"}
                </Button>
              </div>
              <p
                className={
                  isZipError ? "text-xs text-red-600" : "text-xs text-muted-foreground"
                }
              >
                {zipMessage}
              </p>
            </form>

            {currentLocation ? (
              <p className="text-xs text-muted-foreground">
                Coordinates: {formatCoords(currentLocation.lat, currentLocation.lon)}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Now
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="min-h-[170px]">
            <CardHeader>
              <CardTitle className="text-base">Current Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              {renderNowPrimary(
                isForecastLoading,
                isForecastError,
                forecastErrorMessage,
                nowPeriod
              )}
            </CardContent>
          </Card>

          <Card className="min-h-[170px]">
            <CardHeader>
              <CardTitle className="text-base">Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              {renderNowSecondary(isForecastLoading, isForecastError, nowPeriod)}
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="min-h-[220px]">
        <CardHeader>
          <CardTitle>Graph</CardTitle>
          <CardDescription>Graph panel placeholder.</CardDescription>
        </CardHeader>
        <CardContent>
          {isForecastLoading ? (
            <div className="flex h-32 items-end gap-2 animate-pulse">
              <div className="h-10 w-6 rounded bg-muted" />
              <div className="h-16 w-6 rounded bg-muted" />
              <div className="h-24 w-6 rounded bg-muted" />
              <div className="h-12 w-6 rounded bg-muted" />
              <div className="h-20 w-6 rounded bg-muted" />
              <div className="h-14 w-6 rounded bg-muted" />
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Temperature trend graph will be rendered here.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="min-h-[220px]">
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Timeline container placeholder.</CardDescription>
        </CardHeader>
        <CardContent>
          {isForecastLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-10 rounded bg-muted" />
              <div className="h-10 rounded bg-muted" />
              <div className="h-10 rounded bg-muted" />
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Hourly timeline view will be rendered here.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-xs text-muted-foreground">
          <p>{healthMessage}</p>
          {generatedAt ? <p>Last updated: {new Date(generatedAt).toLocaleString()}</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
