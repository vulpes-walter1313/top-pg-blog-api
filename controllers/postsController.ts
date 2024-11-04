import { type Request, type Response, type NextFunction } from "express";
import asyncHandler from "express-async-handler";
import {
  body,
  query,
  param,
  validationResult,
  matchedData,
} from "express-validator";
import { checkJWT, protectRoute } from "../middleware/auth";
import db from "../db/db";
import { Prisma } from "@prisma/client";

// GET /posts
export const postsGET = [
  checkJWT,
  query("limit").isInt({ min: 5, max: 50 }),
  query("page").isInt({ min: 1 }),
  query("publishedstatus").custom((val) => {
    return ["all", "published", "unpublished"].includes(val);
  }),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const valResult = validationResult(req);
    const data = matchedData(req);
    let limit: number;
    let page: number;
    let publishedStatus: "all" | "published" | "unpublished";

    if (!valResult.isEmpty()) {
      res.status(400).json({ success: false, errors: valResult.array() });
      return;
    }
    limit = parseInt(data.limit || "10");
    page = parseInt(data.page || "1");
    switch (data.publishedstatus) {
      case "all":
        publishedStatus = "all";
        break;
      case "published":
        publishedStatus = "published";
        break;
      case "unpublished":
        publishedStatus = "unpublished";
        break;
      default:
        publishedStatus = "published";
    }
    if (req.user && req.user.isAdmin) {
      // if admin, then code below is valid
      const whereOptions: Prisma.PostWhereInput = {};
      if (publishedStatus === "published") {
        whereOptions.published = true;
      } else if (publishedStatus === "unpublished") {
        whereOptions.published = false;
      }
      const totalPosts = await db.post.count({
        where: whereOptions,
      });
      const totalPages = Math.ceil((totalPosts === 0 ? 1 : totalPosts) / limit);
      if (page > totalPages) page = totalPages;
      const offset = (page - 1) * limit;
      const posts = await db.post.findMany({
        where: whereOptions,
        orderBy: {
          updatedAt: "desc",
        },
        take: limit,
        skip: offset,
      });
      res.json({
        success: true,
        posts: posts,
        totalPosts,
        totalPages,
        currentPage: page,
      });
      return;
    }

    // what happens if user is not authed or authed but not admin

    const totalPosts = await db.post.count({
      where: {
        published: true,
      },
    });
    const totalPages = Math.ceil((totalPosts === 0 ? 1 : totalPosts) / limit);
    if (page > totalPages) page = totalPages;
    const offset = (page - 1) * limit;

    const posts = await db.post.findMany({
      where: {
        published: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    res.json({
      success: true,
      posts: posts,
      totalPages: totalPages,
      totalPosts: totalPosts,
      currentPage: page,
    });
    return;
  }),
];

// POST /posts
export const postsPOST = [
  protectRoute,
  body("title").trim().isLength({ min: 1, max: 256 }).escape(),
  body("content").trim().isLength({ min: 1, max: 4900 }).escape(),
  body("slug").trim().isSlug(),
  body("published").isBoolean(),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const valResult = validationResult(req);
    const data = matchedData(req);

    if (!valResult.isEmpty()) {
      res.status(400).json({ success: false, errors: valResult.array() });
      return;
    }
    if (req.user && req.user.isAdmin === false) {
      res.status(403).json({
        success: false,
        error: "You are not authorized to use this resource",
      });
      return;
    }
    // we know user is admin at this point
    const title = String(data.title);
    const content = String(data.content);
    const slug = String(data.slug);
    const isPublished = Boolean(data.published);
    const newPost = await db.post.create({
      data: {
        title,
        content,
        slug,
        published: isPublished,
        authorId: req.user?.id!,
      },
      select: {
        id: true,
        slug: true,
      },
    });
    res.json({
      success: true,
      msg: `new post ${newPost.id} created successfully: /posts/${newPost.slug}`,
    });
  }),
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
