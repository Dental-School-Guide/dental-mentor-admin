import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

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
});

export type ExtractedContent = z.infer<typeof contentSchema>;

export async function extractLessonContent(
  lessonUrl: string
): Promise<ExtractedContent> {
  const stagehand = new Stagehand({
    env: "LOCAL",
    model: "google/gemini-2.5-flash",
    localBrowserLaunchOptions: {
      headless: true,
    },
  });

  try {
    await stagehand.init();
    console.log(`Stagehand Session Started in LOCAL mode`);

    const page = stagehand.context.pages()[0];

    // Navigate to the target page first
    console.log("Navigating to target page...");
    await page.goto(lessonUrl);

    await page.waitForLoadState("load");

    // Check if the page shows member-only message
    const bodyText = await page.locator('body').textContent();
    if (bodyText && bodyText.includes("This page is only available for members")) {
      console.log("Member-only page detected, clicking login button...");
      
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

      // Wait after login and navigate back to target page
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      console.log("Navigating back to target page after login...")
      await page.goto(lessonUrl);
      await page.waitForLoadState("load");

      // Check again if still showing member-only message
      const bodyTextAfterLogin = await page.locator('body').textContent();
      if (bodyTextAfterLogin && bodyTextAfterLogin.includes("This page is only available for members")) {
        console.error("Login failed: Page still shows member-only message after login");
        throw new Error("Login failed: This page is only available for members. Please check your credentials.");
      }
    } else {
      console.log("Page is accessible, no login required or already logged in");
    }

    // Extract the page content
    console.log("Extracting page content...");
    const extractedContent = await stagehand.extract(
      "Extract all the text content from this page including the title, main content, and all sections",
      contentSchema
    );

    console.log("Content extracted successfully!");

    return extractedContent;
  } catch (error) {
    console.error("Error during content extraction:", error);
    throw error;
  } finally {
    try {
      await stagehand.close();
      console.log("Stagehand session closed");
    } catch (closeError) {
      console.error("Error closing Stagehand:", closeError);
    }
  }
}

export function formatExtractedContent(content: ExtractedContent): string {
  let textContent = `Title: ${content.title}\n\n`;
  textContent += `Main Content:\n${content.mainContent}\n\n`;
  textContent += `Sections:\n`;

  content.sections.forEach((section, index) => {
    textContent += `\n${index + 1}. ${section.heading}\n`;
    textContent += `${section.content}\n`;
  });

  return textContent;
}

// Chunk content into smaller pieces for embedding
export function chunkContent(content: string, chunkSize: number = 512, overlap: number = 50): string[] {
  const chunks: string[] = [];
  const lines = content.split('\n');
  let currentChunk = '';
  
  for (const line of lines) {
    if ((currentChunk + line).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep some overlap
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-overlap).join(' ') + '\n' + line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}
