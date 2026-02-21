import Link from "next/link"
import { BookOpen, FileText, Layers } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-background to-muted/20 p-8">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <div className="mb-4 flex items-center justify-center rounded-2xl bg-primary/10 p-4">
          <BookOpen className="h-12 w-12 text-primary" />
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          zotes
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
          Your personal knowledge management system. Organize your notes,
          track your projects, and keep everything in sync.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className={buttonVariants({ size: "lg" })}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Get Started
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-muted p-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">Notes</h3>
          <p className="text-center text-sm text-muted-foreground">
            Capture ideas, thoughts, and documentation in one place
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-muted p-3">
            <Layers className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">Projects</h3>
          <p className="text-center text-sm text-muted-foreground">
            Organize your work by project for better context
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-muted p-3">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">Multi-user</h3>
          <p className="text-center text-sm text-muted-foreground">
            Share access with collaborators while keeping your data separate
          </p>
        </div>
      </div>
    </div>
  )
}
