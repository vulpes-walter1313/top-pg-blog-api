import { type Request, type Response, type NextFunction } from "express";

// GET /posts
export const postsGET = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({ success: true, msg: "GET /posts to be implemented" });
  },
];

// POST /posts
export const postsPOST = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({ success: true, msg: "POST /posts to be implemented" });
  },
];

// GET /posts/:postId
export const postGET = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({ success: true, msg: "GET /posts/:postId to be implemented" });
  },
];

// PUT /posts/:postId
export const postPUT = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({ success: true, msg: "PUT /posts/:postId to be implemented" });
  },
];

// DELETE /posts/:postId
export const postDELETE = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({ success: true, msg: "DELETE /posts/:postId to be implemented" });
  },
];

// GET /posts/:postId/comments
export const postCommentsGET = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({
      success: true,
      msg: "GET /posts/:postId/comments to be implemented",
    });
  },
];

// POST /posts/:postId/comments
export const postCommentsPOST = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({
      success: true,
      msg: "POST /posts/:postId/comments to be implemented",
    });
  },
];

// PUT /posts/:postId/comments/:commentId
export const postCommentPUT = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({
      success: true,
      msg: "PUT /posts/:postId/comments/:commentId to be implemented",
    });
  },
];

// DELETE /posts/:postId/comments/:commentId
export const postCommentDELETE = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({
      success: true,
      msg: "DELETE /posts/:postId/comments/:commentId to be implemented",
    });
  },
];
