import { createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createAdminClient()
    const userId = params.id

    // Delete user's conversations first
    const { error: conversationsError } = await supabase
      .from('voltagent_memory_conversations')
      .delete()
      .eq('user_id', userId)

    if (conversationsError) {
      console.error('Error deleting user conversations:', conversationsError)
    }

    // Delete the user from auth
    const { error: userError } = await supabase.auth.admin.deleteUser(userId)

    if (userError) {
      console.error('Error deleting user:', userError)
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/users/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
