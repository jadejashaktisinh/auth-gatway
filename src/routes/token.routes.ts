import "dotenv/config";
import { Router, type Request, type Response } from "express";
import tokenController from "../controllers/tokens.controller.js";

const router = Router();

router.post("/oauth/token", tokenController);

export default router;
