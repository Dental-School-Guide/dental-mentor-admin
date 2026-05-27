import { GoogleGenerativeAI, type EmbedContentRequest } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Must stay in sync with the retriever in dental-mentor-ai (LessonRetriever)
// which embeds queries with gemini-embedding-001 at 768 dimensions.
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    const embeddings: number[][] = [];

    for (const text of texts) {
      // `outputDimensionality` is supported by the REST API and the
      // gemini-embedding-001 model but is missing from the
      // @google/generative-ai v0.24 type definitions, so we cast.
      const request = {
        content: { role: "user", parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      } as unknown as EmbedContentRequest;

      const result = await model.embedContent(request);
      embeddings.push(result.embedding.values);
    }

    return embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error("Failed to generate embeddings");
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = await generateEmbeddings([text]);
  return embeddings[0];
}
