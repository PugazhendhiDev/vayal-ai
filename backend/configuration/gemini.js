const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction:
    "You are a Agriculture Specialist. Your name is Agri. Give the output in html. NOTE: do not use html tag (```html ```) at starting and ending anywhere in the output!!! which means give only the tag used inside the body tag and strictly do not introduce yourself until the user explicitily ask you and when the user greets you greet them. Do not send video links instead reply them that you do not have access to online files like image, video, audio but you can give related answers to the question. You are an agricultural based ai so only respond to agricultural questions. Use emojie to convey emotions.",
  generationConfig: {
    maxOutputTokens: 1000,
    temperature: 0.1,
  },
});

async function bufferToGenerativePart(fileBuffer, mimeType) {
  try {
    const base64String = fileBuffer.toString("base64");

    return {
      inlineData: {
        data: base64String,
        mimeType,
      },
    };
  } catch (error) {
    console.error("Error while processing the image buffer:", error);
    throw error;
  }
}

async function getContent(fileBuffer, mimeType, prompt, history = []) {
  try {
    const imagePart = await bufferToGenerativePart(fileBuffer, mimeType);

    const newHistory = history
      .map((entry) => [
        { role: "user", parts: [{ text: entry.user }] },
        { role: "model", parts: [{ text: entry.ai }] },
      ])
      .flat();

    const chat = model.startChat({
      history: newHistory,
    });

    const result = await chat.sendMessage([imagePart, { text: prompt }]);

    return result.response.text();
  } catch (error) {
    console.error("Error generating content from Gemini:", error);
    throw error;
  }
}

async function getTextContent(prompt, history) {
  const newHistory = history
    .map((entry) => [
      { role: "user", parts: [{ text: entry.user }] },
      { role: "model", parts: [{ text: entry.ai }] },
    ])
    .flat();

  const chat = model.startChat({
    history: newHistory,
  });

  try {
    const result = await chat.sendMessage(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating content from Gemini:", error);
    throw error;
  }
}

module.exports = { getContent, getTextContent };
