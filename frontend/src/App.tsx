import { useEffect, useState } from "react"

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

type HealthState = "idle" | "loading" | "ok" | "error"

function App() {
  const [healthState, setHealthState] = useState<HealthState>("idle")
  const [healthMessage, setHealthMessage] = useState("Not checked yet.")

  const checkHealth = async () => {
    setHealthState("loading")
    setHealthMessage("Checking /api/health ...")

    try {
      const response = await fetch("/api/health")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = (await response.json()) as { status?: string }
      if (data.status === "ok") {
        setHealthState("ok")
        setHealthMessage("Backend is healthy: status=ok")
      } else {
        setHealthState("error")
        setHealthMessage("Unexpected health payload.")
      }
    } catch (error) {
      setHealthState("error")
      setHealthMessage(
        error instanceof Error ? error.message : "Unable to reach backend."
      )
    }
  }

  useEffect(() => {
    void checkHealth()
  }, [])

  return (
    <AppShell
      title="Hello from Weather Site"
      subtitle="Frontend scaffold with API proxy and health check."
    >
      <Card>
        <CardHeader>
          <CardTitle>UI Baseline Ready</CardTitle>
          <CardDescription>
            Tailwind utilities and shadcn components are wired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="api">API Check</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="text-sm text-muted-foreground">
              This is a minimal starter screen for the frontend POC.
            </TabsContent>
            <TabsContent value="status" className="text-sm text-muted-foreground">
              Component baseline: Button, Card, and Tabs.
            </TabsContent>
            <TabsContent value="api" className="text-sm text-muted-foreground">
              Frontend calls <code>/api/health</code> through the Vite proxy.
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-4">
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
        </CardFooter>
      </Card>
    </AppShell>
  )
}

export default App
