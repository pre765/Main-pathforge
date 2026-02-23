const Request = require("../models/Request");
const User = require("../models/User");

// ✅ Send Request (Search guider by name or domain)
exports.sendRequest = async (req, res) => {
  try {
    const { studentId, guiderName, domain } = req.body;

    // 🔍 Find guider by name or domain & role = guider
    const guider = await User.findOne({
      role: "guider",
      $or: [
        { name: guiderName },
        { domain: domain }
      ]
    });

    if (!guider) {
      return res.status(404).json({
        success: false,
        message: "Guider not found"
      });
    }

    // 🚫 Prevent duplicate request
    const existing = await Request.findOne({
      student: studentId,
      guider: guider._id
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Request already sent"
      });
    }

    // ✅ Create request
    const request = await Request.create({
      student: studentId,
      guider: guider._id
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


// ✅ Accept Request
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


// ✅ View Requests for Guider
exports.getGuiderRequests = async (req, res) => {
  try {
    const { guiderId } = req.params;

    const requests = await Request.find({ guider: guiderId })
      .populate("student", "name email")
      .populate("guider", "name email domain");

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