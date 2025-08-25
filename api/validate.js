export default async function handler(req, res) {
  console.log('Validate API called');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Journey Builder calls validate to check if the activity is properly configured
    return res.status(200).json({
      success: true,
      valid: true,
      message: "Activity configuration is valid"
    });
  } catch (error) {
    console.error('Validate error:', error);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error.message
    });
  }
}