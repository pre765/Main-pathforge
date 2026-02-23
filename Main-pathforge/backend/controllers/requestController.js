const Request = require("../models/Request");


// ✅ Send Request (Student → Guider)
exports.sendRequest = async (req, res) => {
  try {
    const { studentId, guiderId } = req.body;

    // Prevent duplicate requests
    const existing = await Request.findOne({
      student: studentId,
      guider: guiderId
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Request already sent"
      });
    }

    const request = await Request.create({
      student: studentId,
      guider: guiderId
    });

    res.status(201).json({
      success: true,
      message: "Request sent successfully",
      data: request
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ✅ Guider Accept Request
exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await Request.findByIdAndUpdate(
      requestId,
      { status: "accepted" },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Request accepted",
      data: request
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ✅ View Requests for Specific Guider
exports.getGuiderRequests = async (req, res) => {
  try {
    const { guiderId } = req.params;

    const requests = await Request.find({ guider: guiderId })
      .populate("student", "name email")
      .populate("guider", "name email");

    res.status(200).json({
      success: true,
      data: requests
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};