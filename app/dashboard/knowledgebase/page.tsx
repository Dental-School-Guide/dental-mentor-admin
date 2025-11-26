import { createClient } from "@/lib/supabase/server"
import { Link as LinkIcon } from "lucide-react"
import { columns, StudentLesson } from "./columns"
import { DataTable } from "./data-table"
import { AddLessonDialog } from "./add-lesson-dialog"

async function getStudentLessons(): Promise<StudentLesson[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('context_links')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching student lessons:', error)
    return []
  }

  // Check embedding status for each lesson
  const lessonsWithStatus = await Promise.all(
    (data || []).map(async (lesson) => {
      const { count } = await supabase
        .from('context_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('context_id', lesson.id)
      
      return {
        ...lesson,
        embeddingStatus: (count && count > 0) ? 'embedded' : 'needs_embedding'
      }
    })
  )

  return lessonsWithStatus
}

export default async function KnowledgeBasePage() {
  const studentLessons = await getStudentLessons()

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-zinc-950 pt-4 pb-4 px-2 border-b">
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-white">Knowledge Base</h1>
          <p className="text-gray-400">
            Manage your dental knowledge base and resources
          </p>
        </div>
      </div>

      <div className="px-2 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LinkIcon className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Context Links</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage context links and resources. Use the Feed action to extract and embed content for RAG.
            </p>
          </div>
          <AddLessonDialog />
        </div>
        <DataTable columns={columns} data={studentLessons} />
      </div>
    </div>
  )
}
