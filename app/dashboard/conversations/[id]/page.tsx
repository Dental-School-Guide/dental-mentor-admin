import { createClient, createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { MarkdownContent } from "@/components/markdown-content"
import { DeleteConversationButton } from "@/components/delete-conversation-button"

type MessagePart = {
  text?: string
  [key: string]: unknown
}

type Message = {
  conversation_id: string
  message_id: string
  user_id: string
  role: string
  parts: string | MessagePart[] | { text?: string; [key: string]: unknown }
  metadata: Record<string, unknown>
  format_version: number
  created_at: string
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const adminClient = await createAdminClient()

  // Fetch conversation details
  const { data: conversation, error: convError } = await supabase
    .from("voltagent_memory_conversations")
    .select("*")
    .eq("id", id)
    .single()

  // Fetch messages for this conversation
  const { data: messages, error: msgError } = await supabase
    .from("voltagent_memory_messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })

  // Fetch user email from auth
  let userEmail = null
  if (conversation) {
    const { data: { user } } = await adminClient.auth.admin.getUserById(conversation.user_id)
    userEmail = user?.email
  }

  if (convError || !conversation) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/conversations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Conversations
          </Button>
        </Link>
        <div className="flex items-center justify-center py-8 text-destructive">
          Error loading conversation: {convError?.message || "Not found"}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/conversations">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Conversations
        </Button>
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {conversation.title || "Untitled Conversation"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Conversation details and message history
          </p>
        </div>
        <DeleteConversationButton
          conversationId={conversation.id}
          conversationTitle={conversation.title}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">User Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm break-all">
              {userEmail || (
                <span className="text-muted-foreground italic">No email</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">User ID</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono text-muted-foreground break-all">
              {conversation.user_id}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {new Date(conversation.updated_at).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {new Date(conversation.created_at).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {conversation.metadata && Object.keys(conversation.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conversation Metadata</CardTitle>
            <CardDescription>Additional information about this conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {Object.entries(conversation.metadata).map(([key, value]) => (
                <div key={key} className="flex flex-col space-y-1 p-3 bg-muted/50 rounded-lg border">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm font-medium">
                    {typeof value === 'object' && value !== null ? (
                      <details className="cursor-pointer">
                        <summary className="text-primary hover:underline">
                          View details
                        </summary>
                        <pre className="text-xs mt-2 p-2 bg-background rounded overflow-auto">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span>{String(value)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            {messages?.length || 0} message(s) in this conversation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {msgError ? (
            <div className="text-destructive p-6">
              Error loading messages: {msgError.message}
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="flex flex-col space-y-4 p-6 max-h-[600px] overflow-y-auto">
              {messages.map((message: Message) => {
                const isUser = message.role === "user"
                
                // Extract text from parts
                let messageText = ""
                if (typeof message.parts === "string") {
                  messageText = message.parts
                } else if (Array.isArray(message.parts)) {
                  messageText = message.parts
                    .map((part: MessagePart) => part.text || JSON.stringify(part))
                    .join("\n")
                } else if (message.parts && typeof message.parts === "object") {
                  messageText = message.parts.text || JSON.stringify(message.parts, null, 2)
                }

                return (
                  <div
                    key={message.message_id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-3 ${
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">
                          {message.role}
                        </span>
                        <span className="text-xs opacity-70">
                          {new Date(message.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-sm">
                        <MarkdownContent content={messageText} />
                      </div>
                      {message.metadata && Object.keys(message.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs opacity-70 cursor-pointer">
                            View metadata
                          </summary>
                          <pre className="text-xs mt-2 p-2 bg-background/20 rounded overflow-auto">
                            {JSON.stringify(message.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No messages in this conversation yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
