import "dotenv/config";
import { Router, type Request, type Response } from "express";
import { db } from "../db/db.js";
import { clients } from "../db/schema/schema.js";
import { eq } from "drizzle-orm/pg-core/expressions";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/oauth/token", async function (req: Request, res: Response) {
  const apiKey = req.get("x-api-key");
  
  if (!apiKey || apiKey.trim() === "") {
    res.status(400).json({
      success: false,
      message: "please provide valid apikey",
    });
    return;
  }

  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.apiKey, apiKey))
    .limit(1);

  const isExists = client.length > 0;

  if (!isExists) {
    res.status(400).json({
      success: false,
      message: "apikey does not exists",
    });
    return;
  }

  const accessToken = jwt.sign({ apiKey }, process.env.JWT_SECRET ?? "", {
    expiresIn: "15m",
  });

  res.status(200).json({
    success: true,
    token: accessToken,
  });
  
});

export default router;
