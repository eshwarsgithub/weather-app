module.exports = async function handler(req, res) {
  console.log('Publish API called');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Journey Builder calls publish when the journey is published
    return res.status(200).json({
      success: true,
      message: "Activity published successfully"
    });
  } catch (error) {
    console.error('Publish error:', error);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error.message
    });
  }
}