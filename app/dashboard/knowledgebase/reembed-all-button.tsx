"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Loader2, CheckCircle2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { reEmbedLesson } from "./actions"
import type { StudentLesson } from "./columns"

type Scope = "stale" | "all"
type Result = { id: string; name: string; ok: boolean; error?: string }

/**
 * Re-embeds lessons one at a time from the browser, so each lesson gets its
 * own server request and no single request runs long enough to time out.
 * The tab has to stay open while it runs.
 */
export function ReEmbedAllButton({ lessons }: { lessons: StudentLesson[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<Scope>("stale")
  const [running, setRunning] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [total, setTotal] = useState(0)
  const stopRequested = useRef(false)

  const staleLessons = lessons.filter((l) => l.embeddingStatus !== "embedded")
  const queue = scope === "stale" ? staleLessons : lessons
  const done = results.length
  const failed = results.filter((r) => !r.ok)

  // Warn before closing the tab mid-run
  useEffect(() => {
    if (!running) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [running])

  const start = async () => {
    stopRequested.current = false
    const runQueue = [...queue] // snapshot: the list refreshes as lessons finish
    setTotal(runQueue.length)
    setResults([])
    setRunning(true)

    for (const lesson of runQueue) {
      if (stopRequested.current) break
      setCurrent(lesson.context_name)
      try {
        const res = await reEmbedLesson(lesson.id, lesson.link)
        setResults((prev) => [
          ...prev,
          { id: lesson.id, name: lesson.context_name, ok: !!res.success, error: res.success ? undefined : res.error },
        ])
      } catch (err) {
        setResults((prev) => [
          ...prev,
          { id: lesson.id, name: lesson.context_name, ok: false, error: err instanceof Error ? err.message : "Unknown error" },
        ])
      }
    }

    setCurrent(null)
    setRunning(false)
    router.refresh()
  }

  const handleOpenChange = (next: boolean) => {
    if (running) return // keep the dialog open while it runs
    setOpen(next)
    if (!next) setResults([])
  }

  const finished = !running && done > 0

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <RefreshCw className="h-4 w-4" />
        Re-embed all
        {staleLessons.length > 0 && (
          <span className="ml-1 rounded-full bg-orange-600 px-2 py-0.5 text-xs text-white">
            {staleLessons.length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Re-embed lessons</DialogTitle>
            <DialogDescription>
              Re-reads each lesson page and refreshes what the chatbot can search. Each lesson takes about
              1–2 minutes. Keep this tab open until it finishes.
            </DialogDescription>
          </DialogHeader>

          {!running && !finished && (
            <div className="space-y-2 text-sm">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "stale"}
                  onChange={() => setScope("stale")}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">Outdated and not-yet-embedded only</span>{" "}
                  <span className="text-muted-foreground">({staleLessons.length} lessons)</span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">All lessons</span>{" "}
                  <span className="text-muted-foreground">({lessons.length} lessons)</span>
                </span>
              </label>
            </div>
          )}

          {(running || finished) && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {done} of {total} done
                  {failed.length > 0 && <span className="text-destructive"> · {failed.length} failed</span>}
                </span>
                {running && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <div className="h-2 w-full rounded bg-muted">
                <div
                  className="h-2 rounded bg-primary transition-all"
                  style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                />
              </div>
              {current && <p className="text-muted-foreground">Working on: {current}</p>}
              {results.length > 0 && (
                <ul className="max-h-48 overflow-y-auto space-y-1">
                  {results.map((r) => (
                    <li key={r.id} className="flex items-start gap-2">
                      {r.ok ? (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
                      )}
                      <span>
                        {r.name}
                        {r.error && <span className="block text-xs text-muted-foreground">{r.error}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <DialogFooter>
            {!running && !finished && (
              <>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={start} disabled={queue.length === 0}>
                  Start ({queue.length})
                </Button>
              </>
            )}
            {running && (
              <Button variant="outline" onClick={() => (stopRequested.current = true)}>
                Stop after this lesson
              </Button>
            )}
            {finished && <Button onClick={() => handleOpenChange(false)}>Close</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
