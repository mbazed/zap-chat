import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { body, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import User from "../models/user.js";
import RefreshToken from "../models/refreshtoken.js";
import { Op } from "sequelize";

dotenv.config();
const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (user, rememberMe = false) => {
  const refreshExpiry = rememberMe ? "30d" : "7d";
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: refreshExpiry,
  });
};

const validateRegistration = [
  body("email").isEmail().normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
    .withMessage(
      "Password must be at least 8 characters long and include letters, numbers, and a special character"
    ),
  body("username").notEmpty().trim(),
];

const validateLogin = [
  body("email").notEmpty().trim().withMessage("Identifier is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const setAuthCookies = (res, accessToken, refreshToken, rememberMe = false) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
};

router.post(
  "/register",
  authLimiter,
  validateRegistration,
  async (req, res) => {
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    const transaction = await User.sequelize.transaction();

    try {
      const { username, email, password } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser)
        return res
          .status(400)
          .json({ message: "User already exists. Please login instead" });

      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername)
        return res.status(400).json({ message: "Username already taken" });

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await User.create(
        {
          username,
          email,
          password: hashedPassword,
        },
        { transaction }
      );

      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);

      await RefreshToken.create(
        {
          token: refreshToken,
          userId: newUser.id,
          expiresAt: refreshTokenExpiry,
        },
        { transaction }
      );

      await transaction.commit();

      setAuthCookies(res, accessToken, refreshToken);

      return res.status(201).json({
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.log(error);
      return res.status(500).json({ message: "Registration failed" });
    }
  }
);

router.post("/login", authLimiter, validateLogin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ message: errors.array() });

  const { email: identifier, password, rememberMe } = req.body;

  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(
    refreshTokenExpiry.getDate() + (rememberMe ? 30 : 7)
  );

  const transaction = await User.sequelize.transaction();

  try {
    const user = await User.findOne({
      where: { [Op.or]: [{ email: identifier }, { username: identifier }] },
    });

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid Credentials" });

    await RefreshToken.destroy({ where: { userId: user.id } }, { transaction });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, rememberMe);

    await RefreshToken.create(
      {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
      },
      { transaction }
    );

    await transaction.commit();

    setAuthCookies(res, accessToken, refreshToken, rememberMe);

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.log(error);
    return res.status(500).json({ message: "Login Failed" });
  }
});

router.post("/refresh", authLimiter, async (req, res) => {
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token provided" });

  const transaction = await RefreshToken.sequelize.transaction();

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    const storedToken = await RefreshToken.findOne({
      where: { token: refreshToken },
    });

    if (!user || !storedToken) {
      await RefreshToken.destroy(
        { where: { token: refreshToken } },
        { transaction }
      );
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }

    await RefreshToken.destroy(
      { where: { token: refreshToken } },
      { transaction }
    );

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user, true);

    await RefreshToken.create(
      {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
      },
      { transaction }
    );

    await transaction.commit();

    setAuthCookies(res, newAccessToken, newRefreshToken, false);

    return res.status(201).json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
});

router.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken)
    await RefreshToken.destroy({ where: { token: refreshToken } });

  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  res.json({ message: "Logged out successfully" });
});

export default router;
