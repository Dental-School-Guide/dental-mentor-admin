"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

interface DeleteConversationButtonProps {
  conversationId: string
  conversationTitle: string
}

export function DeleteConversationButton({
  conversationId,
  conversationTitle,
}: DeleteConversationButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    try {
      // Delete messages first (foreign key constraint)
      const { error: messagesError } = await supabase
        .from("voltagent_memory_messages")
        .delete()
        .eq("conversation_id", conversationId)

      if (messagesError) {
        console.error("Error deleting messages:", messagesError)
        alert("Failed to delete conversation messages. Please try again.")
        setIsDeleting(false)
        return
      }

      // Delete conversation
      const { error: conversationError } = await supabase
        .from("voltagent_memory_conversations")
        .delete()
        .eq("id", conversationId)

      if (conversationError) {
        console.error("Error deleting conversation:", conversationError)
        alert("Failed to delete conversation. Please try again.")
        setIsDeleting(false)
        return
      }

      // Success - redirect to conversations list
      router.push("/dashboard/conversations")
      router.refresh()
    } catch (error) {
      console.error("Unexpected error:", error)
      alert("An unexpected error occurred. Please try again.")
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Conversation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Conversation</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this conversation? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              {conversationTitle || "Untitled Conversation"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">ID: {conversationId}</p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Conversation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
