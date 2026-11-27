import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

type Rating = "up" | "down"
type Filter = Rating | "all"

type MessagePart = { text?: string; [key: string]: unknown }
type Row = {
  message_id: string
  conversation_id: string
  user_id: string
  role: string
  parts: string | MessagePart[] | MessagePart | null
  metadata: { feedback?: Rating; feedback_comment?: string; feedback_reasons?: string[]; feedback_at?: string } | null
  created_at: string
}

function textOf(parts: Row["parts"]): string {
  if (!parts) return ""
  if (typeof parts === "string") return parts
  if (Array.isArray(parts)) return parts.map((p) => p.text || "").join("\n")
  return parts.text || ""
}

function clip(text: string, max: number) {
  // Drop the auto-appended sources block, then shorten
  const body = text.split("\n---\n\n**📚 Sources:**")[0].trim()
  return body.length > max ? `${body.slice(0, max).trimEnd()}…` : body
}

const fmt = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })
    : ""

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ rating?: string }>
}) {
  const { rating: ratingParam } = await searchParams
  const filter: Filter = ratingParam === "up" || ratingParam === "all" ? ratingParam : "down"
  const supabase = await createAdminClient()

  // Every rated answer (ratings live in the message's metadata)
  const { data: rated, error } = await supabase
    .from("voltagent_memory_messages")
    .select("message_id, conversation_id, user_id, role, parts, metadata, created_at")
    .eq("role", "assistant")
    .not("metadata->>feedback", "is", null)
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    return <div className="p-6 text-destructive">Error loading feedback: {error.message}</div>
  }

  const rows = (rated || []) as Row[]
  const ups = rows.filter((r) => r.metadata?.feedback === "up").length
  const downs = rows.filter((r) => r.metadata?.feedback === "down").length
  const total = ups + downs
  const helpful = total ? Math.round((ups / total) * 100) : null
  const reasonCounts = new Map<string, number>()
  for (const r of rows) {
    if (r.metadata?.feedback !== "down") continue
    for (const reason of r.metadata.feedback_reasons || []) reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1)
  }
  const topReasons = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  const shown = rows
    .filter((r) => filter === "all" || r.metadata?.feedback === filter)
    .sort((a, b) => (b.metadata?.feedback_at || b.created_at).localeCompare(a.metadata?.feedback_at || a.created_at))

  // The question each answer responded to: the latest user message before it
  const convIds = [...new Set(shown.map((r) => r.conversation_id))]
  const questions = new Map<string, string>()
  if (convIds.length) {
    const { data: userMsgs } = await supabase
      .from("voltagent_memory_messages")
      .select("conversation_id, parts, created_at")
      .eq("role", "user")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: true })
    for (const answer of shown) {
      const before = (userMsgs || []).filter(
        (m) => m.conversation_id === answer.conversation_id && m.created_at <= answer.created_at
      )
      const q = before[before.length - 1]
      if (q) questions.set(answer.message_id, textOf(q.parts as Row["parts"]))
    }
  }

  // Student emails
  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const emails = new Map(usersData?.users?.map((u) => [u.id, u.email]) || [])

  const tab = (value: Filter, label: string) => (
    <Link
      href={`/dashboard/feedback?rating=${value}`}
      className={`rounded-md px-3 py-1.5 text-sm ${filter === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
    >
      {label}
    </Link>
  )

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-zinc-950 pt-4 pb-4 px-2 border-b">
        <h1 className="text-3xl font-bold tracking-tight text-white">Feedback</h1>
        <p className="text-gray-400">Students&apos; 👍/👎 on Eden&apos;s answers. Fix the 👎 ones by updating the FAQ doc, a lesson, or the school sheet.</p>
      </div>

      <div className="px-2 grid gap-3 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Helpful</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{helpful === null ? "—" : `${helpful}%`}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">👍 Ratings</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{ups}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">👎 Ratings</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{downs}</CardContent></Card>
      </div>

      {topReasons.length > 0 && (
        <div className="px-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Top 👎 reasons: </span>
          {topReasons.map(([reason, count]) => `${reason} (${count})`).join(" · ")}
        </div>
      )}

      <div className="px-2 flex gap-2">
        {tab("down", `👎 Not helpful (${downs})`)}
        {tab("up", `👍 Helpful (${ups})`)}
        {tab("all", `All (${total})`)}
      </div>

      <div className="px-2 space-y-3">
        {shown.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">No ratings here yet.</div>
        )}
        {shown.map((r) => (
          <Card key={r.message_id}>
            <CardContent className="space-y-3 pt-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge className={r.metadata?.feedback === "down" ? "bg-red-600" : "bg-green-600"}>
                  {r.metadata?.feedback === "down" ? "👎 Not helpful" : "👍 Helpful"}
                </Badge>
                <span>{fmt(r.metadata?.feedback_at || r.created_at)}</span>
                <span>· {emails.get(r.user_id) || "unknown student"}</span>
                <Link href={`/dashboard/conversations/${r.conversation_id}`} className="ml-auto text-primary hover:underline">
                  Open conversation →
                </Link>
              </div>
              {Array.isArray(r.metadata?.feedback_reasons) && r.metadata.feedback_reasons.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {r.metadata.feedback_reasons.map((reason) => (
                    <Badge key={reason} variant="secondary">{reason}</Badge>
                  ))}
                </div>
              )}
              {r.metadata?.feedback_comment && (
                <div className="rounded-md border border-red-600/40 bg-red-600/10 p-3 text-sm">
                  <span className="font-semibold">Student&apos;s note: </span>{r.metadata.feedback_comment}
                </div>
              )}
              <div className="text-sm"><span className="font-semibold">Question: </span>{clip(questions.get(r.message_id) || "(not found)", 400)}</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap"><span className="font-semibold text-foreground">Eden: </span>{clip(textOf(r.parts), 700)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
