import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { ConversationsDataTable } from "@/components/conversations-data-table"

export default async function ConversationsPage() {
  const supabase = await createClient()
  const adminClient = await createAdminClient()
  
  // Fetch all conversations from the database
  const { data: conversations, error } = await supabase
    .from("voltagent_memory_conversations")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) {
    return (
      <div className="space-y-4">
        <div className="sticky top-0 z-10 bg-zinc-950 pt-4 pb-4 px-2 border-b">
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-white">Conversations</h1>
            <p className="text-gray-400">
              View and manage user conversations with the AI mentor
            </p>
          </div>
        </div>
        <div className="px-2">
          <div className="flex items-center justify-center py-8 text-destructive">
            Error loading conversations: {error.message}
          </div>
        </div>
      </div>
    )
  }

  // Fetch all auth users to map user_id to email
  const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers()
  
  // Create a map of user_id to email
  const userEmailMap = new Map(
    users?.map(user => [user.id, user.email]) || []
  )

  // Add user email to conversations
  const conversationsWithEmail = conversations?.map(conv => ({
    ...conv,
    user_email: userEmailMap.get(conv.user_id) || null
  })) || []

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-zinc-950 pt-4 pb-4 px-2 border-b">
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-white">Conversations</h1>
          <p className="text-gray-400">
            View and manage user conversations with the AI mentor
          </p>
        </div>
      </div>
      <div className="px-2">
        <ConversationsDataTable data={conversationsWithEmail} />
      </div>
    </div>
  )
}
