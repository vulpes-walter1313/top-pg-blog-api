import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import db from "../db/db";

/**
 * This middleware checks for authorization header and
 * populates req.user if valid token is present. If no
 * auth header is present, it still allows the request
 * to pass through.
 */
export async function checkJWT(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.get("Authorization");
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = await jwt.verify(token, process.env.JWT_SECRET!);
      const userId = String(payload.sub);
      if (!userId) {
        throw new Error("userId not specified in JWT");
      }
      const user = await db.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user) {
        throw new Error("User in JWT does not exist");
      }
      req.user = user;
      next();
      return;
    } catch (err) {
      res.status(400).json({ success: false, error: err });
      return;
    }
  } else {
    console.log("No auth header sent");
    next();
  }
}

/**
 * This middleware checks for a valid auth header. If
 * Auth token is not valid or auth header is not present
 * a 401 response is sent back.
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express NextFunction
 */
export async function protectRoute(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    res
      .status(401)
      .json({ success: false, error: "No authorization header was found." });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ success: false, error: "Bearer token not found" });
    return;
  }

  try {
    const payload = await jwt.verify(token, process.env.JWT_SECRET!);
    const userId = String(payload.sub);
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new Error("User from token does not exist");
    }
    req.user = user;
    return next();
  } catch (err) {
    res.status(401).json({ success: false, error: err });
    return;
  }
}
