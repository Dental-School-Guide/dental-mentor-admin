"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { bulkInsertLessonsAction } from "./actions"

type BulkInsertResult = 
  | {
      success: true
      message: string
      inserted: number
      skipped: number
      lessons?: unknown[]
    }
  | {
      success: false
      error: string
    }

export default function BulkInsertPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BulkInsertResult | null>(null)

  const handleBulkInsert = async () => {
    setLoading(true)
    setResult(null)
    const toastId = toast.loading("Inserting lessons into database...")

    try {
      const response = await bulkInsertLessonsAction()

      if (response.success) {
        toast.success(
          `${response.message}! Inserted: ${response.inserted}, Skipped: ${response.skipped}`,
          { id: toastId, duration: 5000 }
        )
        setResult(response as BulkInsertResult)
      } else {
        toast.error(`Failed: ${response.error}`, { id: toastId })
        setResult(response as BulkInsertResult)
      }
    } catch (error) {
      console.error("Bulk insert error:", error)
      toast.error("Failed to insert lessons. Please try again.", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Bulk Insert Student Lessons</h1>
        <p className="text-muted-foreground mt-2">
          Insert all student lessons into the database at once
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insert 21 Student Lessons</CardTitle>
          <CardDescription>
            This will insert all predefined student lessons into the context_links table.
            Duplicate entries will be automatically skipped.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleBulkInsert}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Inserting Lessons...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Insert All Lessons
              </>
            )}
          </Button>

          {result && (
            <div className={`mt-4 p-4 rounded-lg border ${
              result.success 
                ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" 
                : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    result.success 
                      ? "text-green-900 dark:text-green-100" 
                      : "text-red-900 dark:text-red-100"
                  }`}>
                    {result.success ? "Success!" : "Error"}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    result.success 
                      ? "text-green-700 dark:text-green-300" 
                      : "text-red-700 dark:text-red-300"
                  }`}>
                    {result.success ? result.message : `Error: ${result.error}`}
                  </p>
                  {result.success && (
                    <div className="mt-2 text-sm space-y-1">
                      <p className="text-green-700 dark:text-green-300">
                        ✓ Inserted: <strong>{result.inserted}</strong> new lessons
                      </p>
                      <p className="text-green-700 dark:text-green-300">
                        ⊘ Skipped: <strong>{result.skipped}</strong> existing lessons
                      </p>
                    </div>
                  )}
                  {!result.success && result.error && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {result.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Lessons to be inserted:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Acceptance & Waitlists Lesson</li>
              <li>• Academic Enrichment Lesson</li>
              <li>• Academic History Lesson</li>
              <li>• Answering Individual School Questions Lesson</li>
              <li>• Application Achievements Essays Lesson</li>
              <li>• Application Experiences Essay Lesson</li>
              <li>• Casper Lesson</li>
              <li>• Confirming Schools Lesson</li>
              <li>• DAT Lesson</li>
              <li>• Dental Experiences Lesson</li>
              <li>• Employment Lesson</li>
              <li>• Frequently Asked Questions</li>
              <li>• How to Pay for School Lesson</li>
              <li>• Intro to Application Lesson</li>
              <li>• LOR Lesson</li>
              <li>• Manual Dexterity Lesson</li>
              <li>• Personal Info Lesson</li>
              <li>• Personal Statement Lesson</li>
              <li>• Preparing For Interviews Lesson</li>
              <li>• Research Lesson</li>
              <li>• Scholarship Lesson</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
