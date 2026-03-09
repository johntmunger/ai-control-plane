import express from "express";
import { orchestrate } from "../runtime/orchestrator";

const router = express.Router();

router.post("/chat", async (req, res) => {
  const { prompt } = req.body;

  const result = await orchestrate(prompt);

  res.json(result);
});

export default router;
