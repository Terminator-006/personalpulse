const { analyzeText } = require("../utils/sentimentAnalysis");

exports.analyzeConversation = async (req, res) => {
  const { text } = req.body;
  const result = analyzeText(text);
  res.json({ analysis: result });
};
