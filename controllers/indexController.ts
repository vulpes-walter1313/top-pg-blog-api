import { type Request, type Response, type NextFunction } from "express";

export const loginPost = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({ success: true, msg: "/login to be implemented" });
  },
];
export const registerPost = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({ success: true, msg: "/register to be implemented" });
  },
];
export const indexGet = (req: Request, res: Response, next: NextFunction) => {
  res.json({ success: true, msg: "Hello to blogapi!" });
};
