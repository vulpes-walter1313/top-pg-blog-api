import { type Request, type Response, type NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { body, matchedData, validationResult } from "express-validator";
import db from "../db/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
      expiresIn: "15m",
    });

    res.json({ success: true, token: token });
  }),
];
export const registerPost = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({ success: true, msg: "/register to be implemented" });
  },
];
export const indexGet = (req: Request, res: Response, next: NextFunction) => {
  res.json({ success: true, msg: "Hello to blogapi!" });
};
