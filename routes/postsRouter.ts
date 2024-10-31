import express from "express";
import * as postController from "../controllers/postsController";

const router = express.Router();

// all routes are prefixed by /posts
router.get("/", postController.postsGET);
router.post("/", postController.postsPOST);
router.get("/:postId", postController.postGET);
router.put("/:postId", postController.postPUT);
router.delete("/:postId", postController.postDELETE);
router.get("/:postId/comments", postController.postCommentsGET);
router.post("/:postId/comments", postController.postCommentsPOST);
router.put("/:postId/comments/:commentId", postController.postCommentPUT);
router.delete("/:postId/comments/:commentId", postController.postCommentDELETE);

export default router;
