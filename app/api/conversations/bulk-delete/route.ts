import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { deleteUntilDate } = await request.json()

    if (!deleteUntilDate) {
      return NextResponse.json(
        { error: "deleteUntilDate is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get all conversations created before the specified date
    const { data: conversationsToDelete, error: fetchError } = await supabase
      .from("voltagent_memory_conversations")
      .select("id")
      .lt("created_at", deleteUntilDate)

    if (fetchError) {
      console.error("Error fetching conversations:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      )
    }

    if (!conversationsToDelete || conversationsToDelete.length === 0) {
      return NextResponse.json({
        message: "No conversations found to delete",
        deletedConversations: 0,
        deletedMessages: 0,
      })
    }

    const conversationIds = conversationsToDelete.map((conv) => conv.id)

    // Delete messages first (foreign key constraint)
    const { error: messagesError, count: deletedMessagesCount } = await supabase
      .from("voltagent_memory_messages")
      .delete({ count: "exact" })
      .in("conversation_id", conversationIds)

    if (messagesError) {
      console.error("Error deleting messages:", messagesError)
      return NextResponse.json(
        { error: "Failed to delete messages" },
        { status: 500 }
      )
    }

    // Delete conversations
    const { error: conversationsError, count: deletedConversationsCount } = await supabase
      .from("voltagent_memory_conversations")
      .delete({ count: "exact" })
      .lt("created_at", deleteUntilDate)

    if (conversationsError) {
      console.error("Error deleting conversations:", conversationsError)
      return NextResponse.json(
        { error: "Failed to delete conversations" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Conversations deleted successfully",
      deletedConversations: deletedConversationsCount || 0,
      deletedMessages: deletedMessagesCount || 0,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
