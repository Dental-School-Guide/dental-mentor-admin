"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Stagehand } from "@browserbasehq/stagehand"
import { z } from "zod"
import { chunkContent } from "@/lib/stagehand/extract-content"
import { generateEmbeddings } from "@/lib/embeddings/google-embeddings"

export async function createLesson(formData: FormData) {
  const supabase = await createClient()

  const lessonName = formData.get("lesson_name") as string
  const link = formData.get("link") as string
  const contextType = formData.get("context_type") as string

  if (!lessonName || !link || !contextType) {
    return { error: "Lesson name, link, and context type are required" }
  }

  const { error } = await supabase
    .from("context_links")
    .insert({
      context_name: lessonName,
      link: link,
      context_type: contextType,
    })

  if (error) {
    console.error("Error creating lesson:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard/knowledgebase")
  return { success: true }
}

export async function updateLesson(id: string, formData: FormData) {
  const supabase = await createClient()

  const lessonName = formData.get("lesson_name") as string
  const link = formData.get("link") as string
  const contextType = formData.get("context_type") as string

  if (!lessonName || !link || !contextType) {
    return { error: "Lesson name, link, and context type are required" }
  }

  const { error } = await supabase
    .from("context_links")
    .update({
      context_name: lessonName,
      link: link,
      context_type: contextType,
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating lesson:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard/knowledgebase")
  return { success: true }
}

export async function deleteLesson(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("context_links")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting lesson:", error)
    return { error: error.message }
  }

  revalidatePath("/dashboard/knowledgebase")
  return { success: true }
}

export async function feedLesson(lessonId: string, lessonUrl: string) {
  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    verbose: 1,
    logger: console.log,
    disablePino: true,
    model: "google/gemini-2.5-flash",
  })

  try {
    console.log(`Starting content extraction for lesson: ${lessonId}`)
    
    await stagehand.init()
    console.log("Stagehand initialized")

    const page = stagehand.context.activePage()
    if (!page) {
      throw new Error("No active page available")
    }

    // Navigate to the lesson page first
    console.log("Navigating to lesson page...")
    await page.goto(lessonUrl, { timeoutMs: 60000, waitUntil: 'domcontentloaded' })
    
    // Wait for page to be fully loaded
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check if the page shows member-only message
    const bodyText = await page.locator('body').textContent();
    if (bodyText && bodyText.includes("This page is only available for members")) {
      console.log("Member-only page detected, attempting login...");
      
      const maxLoginAttempts = 3;
      let loginSuccessful = false;
      
      for (let attempt = 1; attempt <= maxLoginAttempts; attempt++) {
        console.log(`Login attempt ${attempt} of ${maxLoginAttempts}...`);
        
        try {
          // Create an agent to handle the login flow
          const agent = stagehand.agent({
            systemPrompt: "You are a helpful assistant that can control a web browser to complete tasks.",
          });

          // Click the login button on the member-only page
          const clickLoginResult = await agent.execute({
            instruction: `Find and click the login button or link on this page to go to the login page.`,
            maxSteps: 5,
          });

          console.log("Click login result:", clickLoginResult.message);

          // Wait for navigation to login page
          await new Promise((resolve) => setTimeout(resolve, 3000));

          // Perform login
          console.log("Logging in with credentials...");
          const email = process.env.DENTAL_SCHOOL_EMAIL;
          const password = process.env.DENTAL_SCHOOL_PASSWORD;
          
          const loginResult = await agent.execute({
            instruction: `Fill in the email field with '${email}' and the password field with '${password}' and then click the login button to sign in.`,
            maxSteps: 10,
          });

          console.log("Login result:", loginResult.message);
          console.log("Login completed:", loginResult.completed);

          // Wait after login and navigate back to lesson page
          await new Promise((resolve) => setTimeout(resolve, 5000));
          
          console.log("Navigating back to lesson page after login...")
          await page.goto(lessonUrl, { timeoutMs: 60000, waitUntil: 'domcontentloaded' })
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // Check again if still showing member-only message
          const bodyTextAfterLogin = await page.locator('body').textContent();
          if (bodyTextAfterLogin && bodyTextAfterLogin.includes("This page is only available for members")) {
            console.log(`Login attempt ${attempt} failed: Page still shows member-only message`);
            
            if (attempt < maxLoginAttempts) {
              console.log(`Retrying login in ${attempt * 2} seconds...`);
              await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
              // Navigate back to the lesson page to trigger login flow again
              await page.goto(lessonUrl, { timeoutMs: 60000, waitUntil: 'domcontentloaded' })
              await new Promise((resolve) => setTimeout(resolve, 3000));
            }
          } else {
            console.log(`Login attempt ${attempt} successful!`);
            loginSuccessful = true;
            break;
          }
        } catch (error) {
          console.error(`Error during login attempt ${attempt}:`, error);
          if (attempt < maxLoginAttempts) {
            console.log(`Retrying in ${attempt * 2} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
          }
        }
      }
      
      if (!loginSuccessful) {
        throw new Error(`Login failed after ${maxLoginAttempts} attempts. This page is only available for members. Please check your credentials and try again.`);
      }
    } else {
      console.log("Page is accessible, no login required or already logged in");
    }

    // Extract content
    console.log("Extracting content...")
    const contentSchema = z.object({
      title: z.string().describe("The page title"),
      mainContent: z.string().describe("The main text content of the page"),
      sections: z
        .array(
          z.object({
            heading: z.string().describe("Section heading"),
            content: z.string().describe("Section content"),
          })
        )
        .describe("All sections on the page"),
    })

    const extractedContent = await stagehand.extract(
      "Extract all the text content from this page including the title, main content, and all sections",
      contentSchema
    )

    console.log("Content extracted successfully!")

    // Format the content
    let formattedContent = `Title: ${extractedContent.title}\n\n`
    formattedContent += `Main Content:\n${extractedContent.mainContent}\n\n`
    formattedContent += `Sections:\n`
    extractedContent.sections.forEach((section: { heading: string; content: string }, index: number) => {
      formattedContent += `\n${index + 1}. ${section.heading}\n`
      formattedContent += `${section.content}\n`
    })

    const supabase = await createClient()

    // Delete existing embeddings
    await supabase
      .from("context_embeddings")
      .delete()
      .eq("context_id", lessonId)

    console.log("Chunking content...")
    const chunks = chunkContent(formattedContent, 512, 50)
    console.log(`Created ${chunks.length} chunks`)

    console.log("Generating embeddings...")
    const embeddings = await generateEmbeddings(chunks)
    console.log(`Generated ${embeddings.length} embeddings`)

    console.log("Storing embeddings in database...")
    const embeddingsToInsert = chunks.map((chunk, index) => ({
      context_id: lessonId,
      content_chunk: chunk,
      chunk_index: index,
      embedding: JSON.stringify(embeddings[index]),
      metadata: {
        title: extractedContent.title,
        section_count: extractedContent.sections.length,
        chunk_length: chunk.length,
      },
    }))

    const { error: insertError } = await supabase
      .from("context_embeddings")
      .insert(embeddingsToInsert)

    if (insertError) {
      console.error("Error storing embeddings:", insertError)
      return { 
        success: false,
        error: "Failed to store embeddings: " + insertError.message 
      }
    }

    console.log("Embeddings stored successfully!")

    return {
      success: true,
      message: "Content extracted and embeddings stored successfully",
      title: extractedContent.title,
      sectionsCount: extractedContent.sections.length,
      chunksCount: chunks.length,
      embeddingsCount: embeddings.length,
    }
  } catch (error) {
    console.error("Error in feed extraction:", error)
    return { 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  } finally {
    try {
      await stagehand.close()
      console.log("Stagehand closed")
    } catch (closeError) {
      console.error("Error closing Stagehand:", closeError)
    }
  }
}

export async function reEmbedLesson(lessonId: string, lessonUrl: string) {
  const supabase = await createClient()
  
  try {
    console.log(`Re-embedding lesson: ${lessonId}`)
    
    // Delete existing embeddings first
    console.log("Deleting existing embeddings...")
    const { error: deleteError } = await supabase
      .from("context_embeddings")
      .delete()
      .eq("context_id", lessonId)
    
    if (deleteError) {
      console.error("Error deleting embeddings:", deleteError)
      return { 
        success: false,
        error: "Failed to delete old embeddings: " + deleteError.message 
      }
    }
    
    console.log("Old embeddings deleted, now extracting and embedding...")
    
    // Now call feedLesson to extract and embed again
    return await feedLesson(lessonId, lessonUrl)
  } catch (error) {
    console.error("Error in re-embed:", error)
    return { 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}
