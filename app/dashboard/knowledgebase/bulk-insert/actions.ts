"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function bulkInsertLessonsAction() {
  const supabase = await createClient()

  const lessons = [
    {
      context_name: "Acceptance & Waitlists Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/acceptances-waitlists-and-d5",
      context_type: "student_lesson"
    },
    {
      context_name: "Academic Enrichment Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-7-academic-enrichment",
      context_type: "student_lesson"
    },
    {
      context_name: "Academic History Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-2-academic-history",
      context_type: "student_lesson"
    },
    {
      context_name: "Answering Individual School Questions Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-6-answering-individual-school-questions",
      context_type: "student_lesson"
    },
    {
      context_name: "Application Achievements Essays Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-4-achievments",
      context_type: "student_lesson"
    },
    {
      context_name: "Application Experiences Essay Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-3-experiences",
      context_type: "student_lesson"
    },
    {
      context_name: "Casper Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-2-the-casper-test",
      context_type: "student_lesson"
    },
    {
      context_name: "Confirming Schools Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-3-confirming-schools",
      context_type: "student_lesson"
    },
    {
      context_name: "DAT Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-1-problemsolving-xn8s8",
      context_type: "student_lesson"
    },
    {
      context_name: "Dental Experiences Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-4-dental-experiences",
      context_type: "student_lesson"
    },
    {
      context_name: "Employment Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-5-employment",
      context_type: "student_lesson"
    },
    {
      context_name: "Frequently Asked Questions",
      link: "https://docs.google.com/document/d/1uJRYo4FXtDzwQg8uW4zwaIY-2IrJwLsS1krOvqkAO7Y/edit?usp=sharing",
      context_type: "external_resource"
    },
    {
      context_name: "How to Pay for School Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/how-to-pay-for-dental-school",
      context_type: "student_lesson"
    },
    {
      context_name: "Intro to Application Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/introduction-to-the-application-process",
      context_type: "student_lesson"
    },
    {
      context_name: "LOR Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-2-collecting-letters-of-recommendation",
      context_type: "student_lesson"
    },
    {
      context_name: "Manual Dexterity Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-9-extra-cur-manual-dexterity",
      context_type: "student_lesson"
    },
    {
      context_name: "Personal Info Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-1-personal-information-section",
      context_type: "student_lesson"
    },
    {
      context_name: "Personal Statement Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-5-personal-statement",
      context_type: "student_lesson"
    },
    {
      context_name: "Preparing For Interviews Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/preparing-for-interviews",
      context_type: "student_lesson"
    },
    {
      context_name: "Research Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/lesson-8-research",
      context_type: "student_lesson"
    },
    {
      context_name: "Scholarship Lesson",
      link: "https://www.dentalschoolguide.com/how-to-get-into-dental-school-course/scholarships",
      context_type: "student_lesson"
    }
  ]

  console.log(`Starting bulk insert of ${lessons.length} lessons...`)

  try {
    // Check for existing lessons to avoid duplicates
    const { data: existingLessons } = await supabase
      .from('context_links')
      .select('link')

    const existingLinks = new Set(existingLessons?.map(l => l.link) || [])
    
    // Filter out lessons that already exist
    const newLessons = lessons.filter(lesson => !existingLinks.has(lesson.link))

    if (newLessons.length === 0) {
      console.log("All lessons already exist in the database!")
      revalidatePath("/dashboard/knowledgebase")
      return {
        success: true,
        message: "No new lessons to insert",
        inserted: 0,
        skipped: lessons.length
      }
    }

    console.log(`Inserting ${newLessons.length} new lessons (${lessons.length - newLessons.length} already exist)...`)

    // Insert new lessons
    const { data, error } = await supabase
      .from('context_links')
      .insert(newLessons)
      .select()

    if (error) {
      console.error("Error inserting lessons:", error)
      return {
        success: false,
        error: error.message
      }
    }

    console.log(`Successfully inserted ${data?.length || 0} lessons!`)

    revalidatePath("/dashboard/knowledgebase")

    return {
      success: true,
      message: `Successfully inserted ${data?.length || 0} lessons`,
      inserted: data?.length || 0,
      skipped: lessons.length - newLessons.length,
      lessons: data
    }
  } catch (error) {
    console.error("Error in bulk insert:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}
