import express from "express";
import * as indexController from "../controllers/indexController";

const router = express.Router();

router.get("/", indexController.indexGet);
router.post("/login", indexController.loginPost);
router.post("/register", indexController.registerPost);

export default router;
