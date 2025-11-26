import { createAdminClient } from "@/lib/supabase/server"
import { UsersDataTable } from "@/components/users-data-table"

export default async function UsersPage() {
  const supabase = await createAdminClient()
  
  // Fetch all auth users
  const { data: { users }, error } = await supabase.auth.admin.listUsers()

  if (error) {
    return (
      <div className="space-y-4">
        <div className="sticky top-0 z-10 bg-zinc-950 pt-4 pb-4 px-2 border-b">
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-white">Users</h1>
            <p className="text-gray-400">
              Manage user accounts and permissions
            </p>
          </div>
        </div>
        <div className="px-2">
          <div className="flex items-center justify-center py-8 text-destructive">
            Error loading users: {error.message}
          </div>
        </div>
      </div>
    )
  }

  // Fetch conversation counts for each user
  const usersWithCounts = await Promise.all(
    (users || []).map(async (user) => {
      const { count } = await supabase
        .from('voltagent_memory_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      return {
        ...user,
        conversationCount: count || 0
      }
    })
  )

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-zinc-950 pt-4 pb-4 px-2 border-b">
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-white">Users</h1>
          <p className="text-gray-400">
            Manage user accounts and permissions
          </p>
        </div>
      </div>
      <div className="px-2">
        <UsersDataTable data={usersWithCounts} />
      </div>
    </div>
  )
}
