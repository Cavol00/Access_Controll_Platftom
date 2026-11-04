import { Router } from "express";
import * as authService from "../services/auth.service.js";

export const authRouter = Router();

authRouter.post("/login", (req, res, next) => {
  try {
    res.json(authService.login(req.body));
  } catch (error) {
    next(error);
  }
});
