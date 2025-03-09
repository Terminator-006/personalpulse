// const { analyzeText } = require("../utils/sentimentAnalysis");

// exports.analyzeConversation = async (req, res) => {
//   const { text } = req.body;
//   const result = analyzeText(text);
//   res.json({ analysis: result });
// };

// const { analyzeText } = require("../utils/sentimentAnalysis");

// exports.analyzeConversation = async (req, res) => {
//   try {
//     const { text } = req.body;

//     // Validate input
//     if (!text || typeof text !== 'string') {
//       return res.status(400).json({
//         success: false,
//         message: "Valid text input is required"
//       });
//     }

//     // Analyze text
//     const result = await analyzeText(text);

//     // Check for analysis error
//     if (result.sentiment === "error") {
//       return res.status(500).json({
//         success: false,
//         message: "Error analyzing text",
//         error: result.error
//       });
//     }

//     res.json({
//       success: true,
//       data: {
//         analysis: result,
//         originalText: text
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Server error during analysis",
//       error: error.message
//     });
//   }
// };

const { analyzeText } = require("../utils/sentimentAnalysis");

exports.analyzeConversation = async (req, res) => {
  try {
    const { text } = req.body;

    // Input validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Valid text input is required"
      });
    }

    // Analyze text
    const analysis = await analyzeText(text);

    res.json({
      success: true,
      data: {
        analysis,
        originalText: text
      }
    });
  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      message: "Error analyzing text",
      error: error.message
    });
  }
};