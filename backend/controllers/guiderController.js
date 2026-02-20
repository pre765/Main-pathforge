const Guider = require("../models/User");
const bcrypt = require("bcryptjs");

// CREATE GUIDER
exports.createGuider = async (req, res) => {
  try {
    const { name, email, password, selectedDomain, skillLevel } = req.body;

    if (!name || !email || !password || !selectedDomain) {
      return res.status(400).json({
        success: false,
        message: "name, email, password and selectedDomain are required"
      });
    }

    const existing = await Guider.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const guider = await Guider.create({
      name,
      email,
      password: hashedPassword,
      role: "guider",
      selectedDomain,
      skillLevel: skillLevel || "advanced"
    });

    res.status(201).json({
      success: true,
      data: {
        id: guider._id,
        name: guider.name,
        email: guider.email,
        role: guider.role,
        selectedDomain: guider.selectedDomain,
        skillLevel: guider.skillLevel
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// GET ALL GUIDERS
exports.getGuiders = async (req, res) => {
  try {
    const query = { role: "guider" };
    if (req.query.domain) {
      query.selectedDomain = req.query.domain;
    }

    const guiders = await Guider.find(query).select("-password");

    res.status(200).json({
      success: true,
      data: guiders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
