import type { ReactNode } from "react"

type AppShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-start justify-center px-4 py-6 sm:px-6 sm:py-8">
      <section className="w-full space-y-4">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </header>
        {children}
      </section>
    </main>
  )
}
