const mongoose = require("mongoose");
const Request = require("../models/Request");
const User = require("../models/User");

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value || "");

const resolveUser = async ({ id, email, role }) => {
  if (id && isObjectId(id)) {
    const userById = await User.findById(id);
    if (userById) return userById;
  }

  if (email) {
    const query = { email: String(email).toLowerCase().trim() };
    if (role) query.role = role;

    const userByEmail = await User.findOne(query);
    if (userByEmail) return userByEmail;
  }

  return null;
};

// Send Request (Student -> Guider)
exports.sendRequest = async (req, res) => {
  try {
    const { studentId, guiderId, studentEmail, guiderEmail } = req.body;

    const student = await resolveUser({ id: studentId, email: studentEmail, role: "student" });
    const guider = await resolveUser({ id: guiderId, email: guiderEmail, role: "guider" });

    if (!student || !guider) {
      return res.status(404).json({
        success: false,
        message: "Student or guider not found"
      });
    }

    const existing = await Request.findOne({
      student: student._id,
      guider: guider._id,
      status: "pending"
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Request already sent"
      });
    }

    // ✅ Create request
    const request = await Request.create({
      student: student._id,
      guider: guider._id
    });

    const populated = await Request.findById(request._id)
      .populate("student", "name email")
      .populate("guider", "name email selectedDomain");

    return res.status(201).json({
      success: true,
      message: "Request sent successfully",
      data: populated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Guider Accept Request
exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId || !isObjectId(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Valid requestId is required"
      });
    }

    const request = await Request.findByIdAndUpdate(
      requestId,
      { status: "accepted" },
      { new: true }
    )
      .populate("student", "name email")
      .populate("guider", "name email selectedDomain");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Request accepted",
      data: request
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// View Requests for Specific Guider (by guider id OR guider email)
exports.getGuiderRequests = async (req, res) => {
  try {
    const { guiderId } = req.params;

    let guider = null;

    if (isObjectId(guiderId)) {
      guider = await User.findOne({ _id: guiderId, role: "guider" });
    }

    if (!guider) {
      guider = await User.findOne({
        email: String(guiderId || "").toLowerCase().trim(),
        role: "guider"
      });
    }

    if (!guider) {
      return res.status(404).json({
        success: false,
        message: "Guider not found"
      });
    }

    const requests = await Request.find({ guider: guider._id, status: "pending" })
      .populate("student", "name email")
      .populate("guider", "name email selectedDomain")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Public helper to list available guiders (optional domain filter)
exports.getGuiders = async (req, res) => {
  try {
    const { domain } = req.query;
    const query = { role: "guider" };

    if (domain) {
      query.selectedDomain = String(domain).trim();
    }

    const guiders = await User.find(query)
      .select("name email selectedDomain role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: guiders
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
