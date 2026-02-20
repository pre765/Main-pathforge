const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const buildAuthResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  selectedDomain: user.selectedDomain,
  skillLevel: user.skillLevel
});

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || "mysecretkey", {
    expiresIn: "7d"
  });

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, selectedDomain, skillLevel } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email and password are required"
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
      selectedDomain,
      skillLevel
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      data: buildAuthResponse(user)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// LOGIN (basic version)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: buildAuthResponse(user)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
