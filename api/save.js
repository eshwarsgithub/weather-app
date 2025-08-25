module.exports = async function handler(req, res) {
  console.log('Save API called');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Journey Builder calls save when the activity configuration is saved
    return res.status(200).json({
      success: true,
      message: "Configuration saved successfully"
    });
  } catch (error) {
    console.error('Save error:', error);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error.message
    });
  }
}