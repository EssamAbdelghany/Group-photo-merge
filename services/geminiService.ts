
import { GoogleGenAI, Modality } from "@google/genai";
import { fileToBase64 } from '../utils/fileUtils';

// Assume process.env.API_KEY is available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export interface MergeResult {
  imageUrl: string | null;
  textResponse: string;
}

export const mergeImages = async (
  groupImageFile: File,
  individualImageFile: File
): Promise<MergeResult> => {
  try {
    // 1. Convert files to Base64
    const groupImageBase64 = await fileToBase64(groupImageFile);
    const individualImageBase64 = await fileToBase64(individualImageFile);

    // 2. Prepare the parts for the API request
    // IMPORTANT: The order is now explicit. Group photo is the base, individual is the addition.
    const groupImagePart = {
      inlineData: { data: groupImageBase64, mimeType: groupImageFile.type },
    };
    const individualImagePart = {
      inlineData: { data: individualImageBase64, mimeType: individualImageFile.type },
    };
    
    // A more direct and unambiguous prompt aligned with the new image order.
    const textPart = {
        text: `You are a skilled photo editor. Your task is to merge two images. The first image is the base group photo. The second image contains a person to add to the group.
        
Please place the person from the second image into the first image, positioning them on the far left of the group.

Ensure the final result is a single, realistic image where the added person blends in naturally. Only output the final merged photo.`
    };

    // 3. Call the Gemini API with the structured request
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        // The order here matches the prompt's description of "first image" and "second image"
        parts: [groupImagePart, individualImagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    // 4. Validate the API response structure
    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      const finishReason = candidate?.finishReason;
      const safetyRatings = JSON.stringify(candidate?.safetyRatings, null, 2);
      let errorMessage = "The AI returned an invalid or empty response.";

      if (finishReason === 'SAFETY') {
        errorMessage = `The request was blocked for safety reasons. Please try different images. Details: ${safetyRatings}`;
      } else if (finishReason) {
        errorMessage = `Image generation failed. Reason: ${finishReason}.`;
      }
      
      console.error("Error from Gemini API:", errorMessage, response);
      throw new Error(errorMessage);
    }

    // 5. Process the response to find image and text data
    let imageUrl: string | null = null;
    let textResponse = "";

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textResponse += part.text.trim() + "\n";
      }
    }
    textResponse = textResponse.trim();

    // 6. NEW: Smart analysis of the text response to detect failure
    // If the AI gives an excuse or explanation, we prioritize showing that text over any image it returned.
    const failureKeywords = ['cannot', 'unable', 'instead', 'failed', 'sorry', 'do not have the ability'];
    const isFailureText = textResponse && failureKeywords.some(keyword => textResponse.toLowerCase().includes(keyword));
    
    if (isFailureText) {
        imageUrl = null; // Discard any returned image if the text indicates failure.
    }

    // 7. Final validation: if we have neither an image nor text, it's a failure.
    if (!imageUrl && !textResponse) {
        throw new Error("The AI's response was empty and did not contain a new image or any explanatory text.");
    }
    
    // Return the result, which might have a null image but valid text feedback
    return { imageUrl, textResponse };

  } catch (error) {
    console.error("Error merging images with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error("An unknown error occurred while communicating with the AI.");
  }
};
