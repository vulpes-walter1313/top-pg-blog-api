import { type Request, type Response, type NextFunction } from "express";
import asyncHandler from "express-async-handler";
import {
  body,
  query,
  param,
  validationResult,
  matchedData,
} from "express-validator";
import { checkJWT, protectRoute, isAdmin } from "../middleware/auth";
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

// GET /posts/:postSlug
export const postGET = [
  checkJWT,
  param("postSlug").isSlug(),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const valResult = validationResult(req);
    const data = matchedData(req);

    if (!valResult.isEmpty()) {
      res.status(400).json({ success: true, errors: valResult.array() });
      return;
    }
    const post = await db.post.findUnique({
      where: {
        slug: data.postSlug,
      },
    });
    if (!post) {
      res.status(404).json({
        success: false,
        error: "The post you're looking for doesn't exist",
      });
      return;
    }

    if (post.published === false) {
      if (!req.user || req.user.isAdmin === false) {
        res.status(403).json({
          success: false,
          error: "You are not authorized to view this resource",
        });
        return;
      }
      res.json({ success: true, post: post });
      return;
    } else {
      // this is a published post that anyone can see
      res.json({ success: true, post: post });
      return;
    }
  }),
];

// PUT /posts/:postSlug
export const postPUT = [
  protectRoute,
  isAdmin,
  param("postSlug").isSlug(),
  body("title").trim().isLength({ min: 1, max: 256 }).escape(),
  body("content").trim().isLength({ min: 1, max: 5000 }).escape(),
  body("slug").isSlug(),
  body("published").isBoolean(),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // at this point auth token is verrified and user.isAdmin === true
    const valResult = validationResult(req);
    const data = matchedData(req);

    if (!valResult.isEmpty()) {
      res.status(400).json({ success: false, errors: valResult.array() });
      return;
    }
    const title = String(data.title);
    const content = String(data.content);
    const isPublished = Boolean(data.published);
    const slug = String(data.slug);
    const { postSlug } = data;

    const updatedPost = await db.post.update({
      where: {
        slug: postSlug,
      },
      data: {
        title,
        content,
        published: isPublished,
        slug,
        updatedAt: new Date(Date.now()),
      },
    });

    res.json({
      success: true,
      msg: `Post Id: ${updatedPost.id} has been updated`,
    });
    return;
  }),
];

// DELETE /posts/:postSlug
export const postDELETE = [
  protectRoute,
  isAdmin,
  param("postSlug").isSlug(),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // at this point we know that the user is an Admin.
    const valResult = validationResult(req);
    const data = matchedData(req);
    if (!valResult.isEmpty()) {
      res.status(400).json({ success: false, errors: valResult.array() });
      return;
    }
    const { postSlug } = data;
    const postToDelete = await db.post.findUnique({
      where: {
        slug: postSlug,
      },
    });
    if (!postToDelete) {
      res
        .status(404)
        .json({ success: false, error: "Couldn't find this resource." });
      return;
    }
    const deletedPost = await db.post.delete({
      where: {
        id: postToDelete.id,
      },
    });

    res.json({
      success: true,
      msg: `Post ID: ${deletedPost.id} deleted successfully`,
    });
  }),
];

// GET /posts/:postSlug/comments
export const postCommentsGET = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({
      success: true,
      msg: "GET /posts/:postSlug/comments to be implemented",
    });
  },
];

// POST /posts/:postSlug/comments
export const postCommentsPOST = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({
      success: true,
      msg: "POST /posts/:postSlug/comments to be implemented",
    });
  },
];

// PUT /posts/:postSlug/comments/:commentId
export const postCommentPUT = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({
      success: true,
      msg: "PUT /posts/:postSlug/comments/:commentId to be implemented",
    });
  },
];

// DELETE /posts/:postSlug/comments/:commentId
export const postCommentDELETE = [
  (req: Request, res: Response, next: NextFunction) => {
    res.json({
      success: true,
      msg: "DELETE /posts/:postSlug/comments/:commentId to be implemented",
    });
  },
];
