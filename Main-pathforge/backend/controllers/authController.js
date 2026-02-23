const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const dns = require("dns").promises;
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const EmailOtp = require("../models/EmailOtp");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OTP_EXP_MINUTES = Number(process.env.OTP_EXP_MINUTES || 10);
const OTP_RESEND_SECONDS = Number(process.env.OTP_RESEND_SECONDS || 60);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);

const withTimeout = (promise, ms = 4000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Email validation timed out")), ms);
    })
  ]);

const hasValidEmailDomain = async (email) => {
  if (!EMAIL_REGEX.test(email)) return false;

  const domain = email.split("@")[1];
  if (!domain) return false;

  try {
    const mxRecords = await withTimeout(dns.resolveMx(domain));
    if (Array.isArray(mxRecords) && mxRecords.length > 0) {
      return true;
    }
  } catch (_) {
    // Some domains may not publish MX and can still accept mail via A/AAAA.
  }

  try {
    const aRecords = await withTimeout(dns.resolve4(domain));
    if (Array.isArray(aRecords) && aRecords.length > 0) {
      return true;
    }
  } catch (_) {
    // Continue to AAAA lookup.
  }

  try {
    const aaaaRecords = await withTimeout(dns.resolve6(domain));
    return Array.isArray(aaaaRecords) && aaaaRecords.length > 0;
  } catch (_) {
    return false;
  }
};

const createOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

const getMailerTransport = () => {
  const hasHostConfig = process.env.SMTP_HOST && process.env.SMTP_PORT;
  const hasServiceConfig = process.env.SMTP_SERVICE;

  if (!hasHostConfig && !hasServiceConfig) {
    throw new Error("SMTP is not configured. Set SMTP_HOST/SMTP_PORT or SMTP_SERVICE.");
  }

  const config = hasServiceConfig
    ? {
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
    : {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

  if (!config.auth.user || !config.auth.pass) {
    throw new Error("SMTP credentials are missing. Set SMTP_USER and SMTP_PASS.");
  }

  return nodemailer.createTransport(config);
};

const sendOtpEmail = async (email, code) => {
  const transporter = getMailerTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to: email,
    subject: "PathForge verification code",
    text: `Your PathForge verification code is ${code}. It expires in ${OTP_EXP_MINUTES} minutes.`,
    html: `<p>Your PathForge verification code is <b>${code}</b>.</p><p>It expires in ${OTP_EXP_MINUTES} minutes.</p>`
  });
};

exports.requestSignupOtp = async (req, res) => {
  try {
    const { name, email, password, selectedDomain, skillLevel } = req.body;
    const normalizedEmail = (email || "").toLowerCase().trim();

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const isValidEmailDomain = await hasValidEmailDomain(normalizedEmail);
    if (!isValidEmailDomain) {
      return res.status(400).json({
        success: false,
        message: "Email does not exist or domain is invalid"
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please log in."
      });
    }

    const existingPending = await EmailOtp.findOne({ email: normalizedEmail });
    if (existingPending && existingPending.lastSentAt) {
      const waitSeconds = Math.ceil(
        (existingPending.lastSentAt.getTime() + OTP_RESEND_SECONDS * 1000 - Date.now()) / 1000
      );

      if (waitSeconds > 0) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSeconds}s before requesting another code.`
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otpCode = createOtpCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const otpExpiresAt = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);

    await EmailOtp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
        selectedDomain,
        skillLevel,
        otpHash,
        otpExpiresAt,
        attempts: 0,
        lastSentAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtpEmail(normalizedEmail, otpCode);

    return res.status(200).json({
      success: true,
      message: "Verification code sent to email"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send verification code"
    });
  }
};

exports.verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = (email || "").toLowerCase().trim();

    if (!normalizedEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: "email and otp are required"
      });
    }

    const pending = await EmailOtp.findOne({ email: normalizedEmail });
    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "No pending verification found. Request a new code."
      });
    }

    if (pending.otpExpiresAt.getTime() < Date.now()) {
      await EmailOtp.deleteOne({ _id: pending._id });
      return res.status(400).json({
        success: false,
        message: "Verification code expired. Request a new code."
      });
    }

    const isOtpMatch = await bcrypt.compare(String(otp).trim(), pending.otpHash);
    if (!isOtpMatch) {
      pending.attempts += 1;
      await pending.save();

      if (pending.attempts >= OTP_MAX_ATTEMPTS) {
        await EmailOtp.deleteOne({ _id: pending._id });
        return res.status(400).json({
          success: false,
          message: "Too many failed attempts. Request a new code."
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid verification code"
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      await EmailOtp.deleteOne({ _id: pending._id });
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please log in."
      });
    }

    const user = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.passwordHash,
      role: "student",
      selectedDomain: pending.selectedDomain,
      skillLevel: pending.skillLevel || "beginner"
    });

    await EmailOtp.deleteOne({ _id: pending._id });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      data: buildAuthResponse(user)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Verification failed"
    });
  }
};

// Legacy direct register endpoint retained for compatibility.
exports.register = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: "Use /auth/register/request-otp and /auth/register/verify-otp to sign up"
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || "").toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required"
      });
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account does not exist. Please sign up."
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google sign-in. Continue with Google."
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

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: buildAuthResponse(user)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: "Google auth is not configured on server"
      });
    }

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "idToken is required"
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = (payload.email || "").toLowerCase().trim();
    const name = payload.name || "Google User";
    const emailVerified = payload.email_verified;

    if (!googleId || !email || !emailVerified) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google account data"
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        googleId,
        role: "student"
      });
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.name && name) {
        user.name = name;
      }
      await user.save();
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token,
      data: buildAuthResponse(user)
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Google authentication failed"
    });
  }
};
