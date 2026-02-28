import { useEffect, useMemo, useRef, useState } from "react"

import type { HourlyPeriod } from "@/api/types"
import { Button } from "@/components/ui/button"

export type TimelineWindow = {
  windowStartIndex: number
  windowSize: number
  endIndex: number
}

type HourlyTimelineProps = {
  periods: HourlyPeriod[]
  windowSize?: number
  onWindowChange?: (window: TimelineWindow) => void
}

function clampWindowStart(
  nextStart: number,
  periodCount: number,
  windowSize: number
): number {
  const maxStart = Math.max(0, periodCount - windowSize)
  return Math.min(Math.max(nextStart, 0), maxStart)
}

function findCurrentHourIndex(periods: HourlyPeriod[]): number {
  if (periods.length === 0) {
    return 0
  }

  const now = Date.now()
  let bestIndex = 0
  let bestDiff = Number.POSITIVE_INFINITY

  periods.forEach((period, index) => {
    const timestamp = Date.parse(period.startTime)
    if (Number.isNaN(timestamp)) {
      return
    }

    const diff = Math.abs(timestamp - now)
    if (diff < bestDiff) {
      bestDiff = diff
      bestIndex = index
    }
  })

  return bestIndex
}

export function HourlyTimeline({
  periods,
  windowSize = 48,
  onWindowChange,
}: HourlyTimelineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [windowStartIndex, setWindowStartIndex] = useState(0)

  useEffect(() => {
    const currentHourIndex = findCurrentHourIndex(periods)
    const alignedStart = clampWindowStart(currentHourIndex, periods.length, windowSize)
    setWindowStartIndex(alignedStart)
  }, [periods, windowSize])

  const endIndex = Math.min(windowStartIndex + windowSize, periods.length)
  const visiblePeriods = useMemo(
    () => periods.slice(windowStartIndex, endIndex),
    [endIndex, periods, windowStartIndex]
  )

  useEffect(() => {
    if (!onWindowChange) {
      return
    }

    onWindowChange({
      windowStartIndex,
      windowSize,
      endIndex,
    })
  }, [endIndex, onWindowChange, windowSize, windowStartIndex])

  const maxStart = Math.max(0, periods.length - windowSize)
  const canJumpForward = windowStartIndex < maxStart

  const jumpWindow = (offset: number) => {
    setWindowStartIndex((currentStart) => {
      const nextStart = clampWindowStart(
        currentStart + offset,
        periods.length,
        windowSize
      )
      if (nextStart !== currentStart) {
        containerRef.current?.scrollTo({ left: 0, behavior: "smooth" })
      }
      return nextStart
    })
  }

  if (periods.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hourly periods available for timeline.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Showing hours {windowStartIndex + 1}-{endIndex} of {periods.length}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              jumpWindow(24)
            }}
            disabled={!canJumpForward}
          >
            +24h
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              jumpWindow(48)
            }}
            disabled={!canJumpForward}
          >
            +48h
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="overflow-x-auto scroll-smooth snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex w-max gap-2 pr-2">
          {visiblePeriods.map((period, index) => {
            const globalIndex = windowStartIndex + index
            const date = new Date(period.startTime)
            const hourLabel = date.toLocaleTimeString([], {
              hour: "numeric",
            })
            const dayLabel = date.toLocaleDateString([], {
              weekday: "short",
            })

            return (
              <article
                key={`${period.startTime}-${globalIndex}`}
                className="w-24 snap-start rounded-md border p-2"
              >
                <p className="text-xs font-medium">{hourLabel}</p>
                <p className="text-[11px] text-muted-foreground">{dayLabel}</p>
                <p className="mt-2 text-sm font-semibold">
                  {period.temperature ?? "--"}
                  {period.temperatureUnit ?? ""}
                </p>
                <p className="line-clamp-2 text-[11px] text-muted-foreground">
                  {period.shortForecast ?? "N/A"}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}

