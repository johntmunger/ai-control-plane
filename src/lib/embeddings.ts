import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a numerical embedding (vector) for this text. Return only a JSON array of numbers: "${text}"`,
      },
    ],
  });

  // Parse the embedding from the response
  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  try {
    // Extract JSON array from response
    const jsonMatch = content.text.match(/\[[\d.,\s-]+\]/);
    if (!jsonMatch) {
      throw new Error("No embedding array found in response");
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Failed to parse embedding:", error);
    throw error;
  }
}
