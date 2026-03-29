import { GoogleGenAI, Type } from "@google/genai";
import { MathProblem, ProblemVariant } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const parseProblems = async (text: string): Promise<MathProblem[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Parse the following math assessment text into a structured list of problems. 
    Identify if they are multiple-choice or short-answer.
    
    Assessment Text:
    ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            originalText: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["multiple-choice", "short-answer"] },
          },
          required: ["id", "originalText", "type"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse problems", e);
    return [];
  }
};

export const generateVariants = async (
  problems: MathProblem[],
  versionLabels: string[]
): Promise<Record<string, ProblemVariant[]>> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `For each math problem provided, generate ${versionLabels.length} variants (labeled ${versionLabels.join(", ")}).
    
    Guidelines:
    1. Intelligent Variable Sweeping: Change numbers but ensure results are "clean" (integers or simple fractions).
    2. Context Swapping: Change the story/context for word problems (e.g., pencils to stickers).
    3. Smart Distractors: For multiple-choice, generate incorrect options based on common student errors.
    4. Provide a step-by-step explanation for the correct answer.
    
    Problems:
    ${JSON.stringify(problems)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          variantsByVersion: {
            type: Type.OBJECT,
            additionalProperties: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  problemId: { type: Type.STRING },
                  versionLabel: { type: Type.STRING },
                  text: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ["problemId", "versionLabel", "text", "correctAnswer", "explanation"],
              },
            },
          },
        },
      },
    },
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return data.variantsByVersion || {};
  } catch (e) {
    console.error("Failed to generate variants", e);
    return {};
  }
};
