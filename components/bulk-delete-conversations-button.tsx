"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export function BulkDeleteConversationsButton() {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("12:00")
  const dateInputRef = useRef<HTMLInputElement>(null)
  const timeInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleDelete = async () => {
    if (!selectedDate) {
      toast.error("Please select a date")
      return
    }

    // Combine date and time
    const dateTimeString = `${selectedDate}T${selectedTime}:00`
    const dateTime = new Date(dateTimeString)

    setIsDeleting(true)
    const toastId = toast.loading("Deleting conversations...")

    try {
      const response = await fetch("/api/conversations/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deleteUntilDate: dateTime.toISOString(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete conversations")
      }

      // Success - close dialog and refresh
      setOpen(false)
      setSelectedDate("")
      setSelectedTime("12:00")
      toast.success(
        `Successfully deleted ${result.deletedConversations} conversation(s) and ${result.deletedMessages} message(s)`,
        { id: toastId, duration: 5000 }
      )
      router.refresh()
    } catch (error) {
      console.error("Error deleting conversations:", error)
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        { id: toastId }
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="bg-white hover:bg-gray-100 text-black border border-gray-300 cursor-pointer"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Bulk Delete Conversations
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Delete Conversations</DialogTitle>
          <DialogDescription>
            Delete all conversations and their messages created before the selected date and time.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-until-date" className="text-base font-semibold">
                Delete old chats until
              </Label>
              <p className="text-sm text-muted-foreground">
                All conversations created before this date will be permanently deleted
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="date-input" className="text-sm mb-2 block">Select Date</Label>
                <div className="relative">
                  <Input
                    ref={dateInputRef}
                    id="date-input"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="h-12 cursor-pointer pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => dateInputRef.current?.showPicker()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <Calendar className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="time-input" className="text-sm mb-2 block">Select Time</Label>
                <div className="relative">
                  <Input
                    ref={timeInputRef}
                    id="time-input"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="h-12 cursor-pointer pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => timeInputRef.current?.showPicker()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <Clock className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            {selectedDate && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive">
                  ⚠️ Warning
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  All conversations created before{" "}
                  <span className="font-semibold">
                    {new Date(selectedDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })} at {selectedTime}
                  </span>{" "}
                  will be permanently deleted.
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              setSelectedDate("")
              setSelectedTime("12:00")
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting || !selectedDate}
            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
          >
            {isDeleting ? "Deleting..." : "Delete Conversations"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
