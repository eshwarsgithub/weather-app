export default async function handler(req, res) {
  console.log('Stop API called');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Journey Builder calls stop when the journey is stopped
    return res.status(200).json({
      success: true,
      message: "Activity stopped successfully"
    });
  } catch (error) {
    console.error('Stop error:', error);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error.message
    });
  }
}