// const analyzeText = (text) => {
//     // AI processing logic goes here
//     return { sentiment: "positive", confidence: 0.92 };
//   };
  
//   module.exports = { analyzeText };
  
// const { GoogleGenerativeAI } = require("@google/generative-ai");

// // Initialize Gemini
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// const analyzeText = async (text) => {
//   try {
//     const model = genAI.getGenerativeModel({ model: "gemini-pro" });

//     const prompt = `Analyze the sentiment and emotions in the following text. Provide a detailed analysis including:
//     1. Primary sentiment (positive, negative, or neutral)
//     2. Confidence score (0-1)
//     3. Emotional tones detected
//     4. Key phrases that indicate the sentiment
    
//     Text to analyze: "${text}"
    
//     Return the analysis in JSON format with these exact keys: sentiment, confidence, emotions, keyPhrases`;

//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const analysisText = response.text();
    
//     // Parse the JSON response
//     let analysis;
//     try {
//       // Remove any markdown formatting if present
//       const jsonStr = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
//       analysis = JSON.parse(jsonStr);
//     } catch (error) {
//       // Fallback if JSON parsing fails
//       analysis = {
//         sentiment: "neutral",
//         confidence: 0.5,
//         emotions: ["unknown"],
//         keyPhrases: []
//       };
//     }

//     return analysis;
//   } catch (error) {
//     console.error('Error in sentiment analysis:', error);
//     return {
//       sentiment: "error",
//       confidence: 0,
//       emotions: [],
//       keyPhrases: [],
//       error: error.message
//     };
//   }
// };

// module.exports = { analyzeText };

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeText = async (text) => {
  try {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze the sentiment of the following text and provide a response in JSON format with the following structure:
    {
      "sentiment": "positive/negative/neutral",
      "confidence": (number between 0 and 1),
      "emotions": ["emotion1", "emotion2"],
      "keyPhrases": ["phrase1", "phrase2"]
    }

    Text to analyze: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    try {
      // Remove any markdown formatting if present
      const jsonStr = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      // Fallback response if JSON parsing fails
      return {
        sentiment: "neutral",
        confidence: 0.5,
        emotions: ["unknown"],
        keyPhrases: [text.substring(0, 50)]
      };
    }
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    throw error;
  }
};

module.exports = { analyzeText };