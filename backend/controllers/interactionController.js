// controllers/interactionController.js
const Interaction = require('../models/Interaction');
const { analyzeText } = require('../utils/sentimentAnalysis');

// Convert sentiment analysis result to score between -1 and 1
const convertToScore = (sentiment, confidence) => {
  switch(sentiment.toLowerCase()) {
    case 'positive':
      return confidence;  // Will be between 0 and 1
    case 'negative':
      return -confidence; // Will be between -1 and 0
    default:
      return 0;          // Neutral
  }
};

// Add new interaction
exports.addInteraction = async (req, res) => {
  try {
    const { profileId, description, type } = req.body;

    // Analyze sentiment
    const analysis = await analyzeText(description);
    
    // Convert sentiment to score
    const sentimentScore = convertToScore(
      analysis.sentiment, 
      analysis.confidence
    );

    const interaction = await Interaction.create({
      userId: req.user._id,
      profileId,
      description,
      type,
      sentiment: {
        score: sentimentScore,
        label: analysis.sentiment,
        confidence: analysis.confidence
      }
    });

    res.status(201).json({
      success: true,
      data: interaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get interactions with filters
exports.getInteractions = async (req, res) => {
  try {
    const { profileId, startDate, endDate, type } = req.query;

    let query = { userId: req.user._id };
    
    if (profileId) query.profileId = profileId;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const interactions = await Interaction.find(query)
      .populate('profileId', 'name')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: interactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get pulse metrics
exports.getPulseMetrics = async (req, res) => {
  try {
    const { profileId, timeframe = 'daily' } = req.query;
    const endDate = new Date();
    const startDate = new Date();

    // Set date range based on timeframe
    switch(timeframe) {
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      default: // daily
        startDate.setDate(endDate.getDate() - 1);
    }

    const interactions = await Interaction.find({
      userId: req.user._id,
      profileId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Process interactions for visualization
    const metrics = interactions.map(interaction => ({
      date: interaction.date,
      score: interaction.sentiment.score,
      description: interaction.description,
      type: interaction.type,
      color: interaction.sentiment.score > 0.5 ? 'green' : 
             interaction.sentiment.score < -0.5 ? 'red' : 'yellow'
    }));

    res.json({
      success: true,
      data: {
        timeframe,
        metrics
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};