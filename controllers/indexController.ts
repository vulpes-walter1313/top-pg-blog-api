import { type Request, type Response, type NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { body, matchedData, validationResult } from "express-validator";
import db from "../db/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { checkJWT, protectRoute } from "../middleware/auth";

export const loginPost = [
  body("email").isEmail().withMessage("Must be a valid email"),
  body("password").notEmpty().withMessage("Password must not be empty"),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const valResult = validationResult(req);
    const data = matchedData(req);

    if (!valResult.isEmpty()) {
      res.status(400).json({ success: false, errors: valResult.array() });
      return;
    }
    const email = String(data.email);
    const password = String(data.password);
    const user = await db.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      res
        .status(400)
        .json({ success: false, error: "email or password is incorrect" });
      return;
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      res
        .status(400)
        .json({ success: false, error: "email or password is incorrect" });
      return;
    }
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
      algorithm: "HS256",
      expiresIn: "4h",
    });

    res.json({ success: true, token: `Bearer ${token}` });
  }),
];

export const registerPost = [
  body("firstName")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("First name must be between 3 and 30 characters long"),
  body("lastName")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Last name must be between 3 and 30 characters long"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Email must be a valid email")
    .custom(async (val) => {
      try {
        const dbUser = await db.user.findUnique({
          where: {
            email: val,
          },
        });
        if (dbUser) {
          throw new Error("Email already registered");
        }
      } catch (err) {
        throw err;
      }
    }),
  body("password")
    .trim()
    .isLength({ min: 8, max: 64 })
    .withMessage("Password must be between 8 and 64 characters long"),
  body("confirmPassword")
    .custom((val, { req }) => val === req.body.password)
    .withMessage("confirmPassword must match password"),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const valResult = validationResult(req);
    const data = matchedData(req);

    if (!valResult.isEmpty()) {
      res.status(400).json({ success: false, errors: valResult.array() });
      return;
    }

    const firstName = String(data.firstName);
    const lastName = String(data.lastName);
    const email = String(data.email);
    const passwordInput = String(data.password);
    const passwordHash = await bcrypt.hash(passwordInput, 10);

    const newUser = await db.user.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: passwordHash,
      },
    });

    const token = jwt.sign({ sub: newUser.id }, process.env.JWT_SECRET!, {
      expiresIn: "4h",
      algorithm: "HS256",
    });

    res.json({
      success: true,
      msg: `User successfully registered: ${newUser.email}`,
      token: `Bearer ${token}`,
    });
  }),
];

// GET /authcheck
export const authCheckGET = [
  checkJWT,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
      res.status(200).json({
        success: true,
        msg: "You are authenticated",
        user: {
          id: req.user.id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          email: req.user.email,
          isAdmin: req.user.isAdmin,
        },
      });
      return;
    } else {
      res
        .status(200)
        .json({ success: false, error: "You are not authenticated" });
      return;
    }
  },
];
