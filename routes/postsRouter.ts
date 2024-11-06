import express from "express";
import * as postController from "../controllers/postsController";

const router = express.Router();

// all routes are prefixed by /posts
router.get("/", postController.postsGET);
router.post("/", postController.postsPOST);
router.get("/:postSlug", postController.postGET);
router.put("/:postSlug", postController.postPUT);
router.delete("/:postSlug", postController.postDELETE);
router.get("/:postSlug/comments", postController.postCommentsGET);
router.post("/:postSlug/comments", postController.postCommentsPOST);
router.get("/:postSlug/comments/:commentId", postController.postCommentGET);
router.put("/:postSlug/comments/:commentId", postController.postCommentPUT);
router.delete(
  "/:postSlug/comments/:commentId",
  postController.postCommentDELETE,
);

export default router;
