"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash, Rss, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { EditLessonDialog } from "./edit-lesson-dialog"
import { DeleteLessonDialog } from "./delete-lesson-dialog"
import { feedLesson, reEmbedLesson } from "./actions"

export type StudentLesson = {
  id: string
  context_name: string
  link: string
  context_type: string
  updated_at: string
  embeddingStatus: 'embedded' | 'needs_embedding'
}

function ActionsCell({ lesson }: { lesson: StudentLesson }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [feedLoading, setFeedLoading] = useState(false)

  const handleFeed = async () => {
    setFeedLoading(true)
    const toastId = toast.loading("Extracting and embedding content...")
    
    try {
      const result = await feedLesson(lesson.id, lesson.link)

      if (result.success) {
        toast.success(
          `Content embedded successfully! Title: ${result.title}, Sections: ${result.sectionsCount}, Chunks: ${result.chunksCount}, Embeddings: ${result.embeddingsCount}`,
          { id: toastId, duration: 5000 }
        )
        // Refresh the page to update status
        window.location.reload()
      } else {
        toast.error(`Failed to embed: ${result.error}`, { id: toastId })
      }
    } catch (error) {
      console.error("Feed error:", error)
      toast.error("Failed to extract content. Please try again.", { id: toastId })
    } finally {
      setFeedLoading(false)
    }
  }

  const handleReEmbed = async () => {
    setFeedLoading(true)
    const toastId = toast.loading("Deleting old embeddings and re-embedding...")
    
    try {
      const result = await reEmbedLesson(lesson.id, lesson.link)

      if (result.success) {
        toast.success(
          `Content re-embedded successfully! Title: ${result.title}, Sections: ${result.sectionsCount}, Chunks: ${result.chunksCount}, Embeddings: ${result.embeddingsCount}`,
          { id: toastId, duration: 5000 }
        )
        // Refresh the page to update status
        window.location.reload()
      } else {
        toast.error(`Failed to re-embed: ${result.error}`, { id: toastId })
      }
    } catch (error) {
      console.error("Re-embed error:", error)
      toast.error("Failed to re-embed content. Please try again.", { id: toastId })
    } finally {
      setFeedLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-accent">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-semibold">Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(lesson.link)}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Update
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive gap-2">
            <Trash className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {lesson.embeddingStatus === 'needs_embedding' ? (
            <DropdownMenuItem onClick={handleFeed} disabled={feedLoading} className="gap-2">
              {feedLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rss className="h-4 w-4" />
              )}
              {feedLoading ? "Embedding..." : "Embed"}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleReEmbed} disabled={feedLoading} className="gap-2">
              {feedLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {feedLoading ? "Re-embedding..." : "Re-embed"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditLessonDialog
        lesson={lesson}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteLessonDialog
        lesson={lesson}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}

export const columns: ColumnDef<StudentLesson>[] = [
  {
    accessorKey: "context_name",
    header: () => {
      return (
        <div className="font-semibold text-sm px-2">Lesson Name</div>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="font-medium px-2 py-3">{row.getValue("context_name")}</div>
      )
    },
    size: 300,
  },
  {
    accessorKey: "context_type",
    header: () => {
      return (
        <div className="font-semibold text-sm px-2">Type</div>
      )
    },
    cell: ({ row }) => {
      const type = row.getValue("context_type") as string
      return (
        <div className="px-2 py-3">
          <Badge variant={type === "student_lesson" ? "default" : "secondary"} className="capitalize whitespace-nowrap">
            {type === "student_lesson" ? "Student Lesson" : "External Resource"}
          </Badge>
        </div>
      )
    },
    size: 150,
  },
  {
    accessorKey: "link",
    header: () => {
      return (
        <div className="font-semibold text-sm px-2">Lesson Link</div>
      )
    },
    cell: ({ row }) => {
      const link = row.getValue("link") as string
      return (
        <div className="px-2 py-3">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1.5 max-w-sm truncate group"
          >
            <span className="truncate text-sm">{link}</span>
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      )
    },
    size: 250,
  },
  {
    accessorKey: "embeddingStatus",
    header: () => {
      return (
        <div className="font-semibold text-sm px-2 text-center">Status</div>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("embeddingStatus") as string
      return (
        <div className="px-2 py-3 flex justify-center">
          <Badge 
            variant={status === "embedded" ? "default" : "secondary"}
            className={status === "embedded" ? "bg-green-600 hover:bg-green-700 whitespace-nowrap" : "bg-yellow-600 hover:bg-yellow-700 whitespace-nowrap"}
          >
            {status === "embedded" ? "Embedded" : "Need to Embed"}
          </Badge>
        </div>
      )
    },
    size: 130,
  },
  {
    accessorKey: "updated_at",
    header: () => {
      return (
        <div className="font-semibold text-sm px-2">Updated At</div>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("updated_at"))
      return (
        <div className="text-sm px-2 py-3">
          <div className="font-medium whitespace-nowrap">{format(date, "MMM dd, yyyy")}</div>
          <div className="text-muted-foreground text-xs whitespace-nowrap">{format(date, "HH:mm")}</div>
        </div>
      )
    },
    size: 120,
  },
  {
    id: "actions",
    header: () => {
      return (
        <div className="font-semibold text-sm text-center px-2">Actions</div>
      )
    },
    cell: ({ row }) => (
      <div className="flex justify-center px-2 py-3">
        <ActionsCell lesson={row.original} />
      </div>
    ),
    size: 80,
  },
]
