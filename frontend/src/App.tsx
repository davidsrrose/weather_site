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

function App() {
  return (
    <AppShell
      title="Hello from Weather Site"
      subtitle="Frontend Ticket 3 scaffold: Vite + React + Tailwind + shadcn/ui."
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
            </TabsList>
            <TabsContent value="overview" className="text-sm text-muted-foreground">
              This is a minimal starter screen for the frontend POC.
            </TabsContent>
            <TabsContent value="status" className="text-sm text-muted-foreground">
              Component baseline: Button, Card, and Tabs.
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-end">
          <Button>Hello</Button>
        </CardFooter>
      </Card>
    </AppShell>
  )
}

export default App
