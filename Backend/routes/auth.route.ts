import express from "express";
import {
  SignIn,
  SignUp,
  SignOut,
  GithubAuth,
  GithubCallback,
  GetMEDetails,
  ForgetPassword,
  VerifyOTP,
  ResetPassword,
  ChangePasswordInApp,
} from "../controllers/auth.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AsyncHandler } from "../helpers/async.handler";

const router = express.Router();

router.post("/sign-in", AsyncHandler(SignIn));

router.post("/forgot-password", AsyncHandler(ForgetPassword));
router.post("/verify-otp", AsyncHandler(VerifyOTP));
router.post("/reset-password", AsyncHandler(ResetPassword));

router.post("/sign-up", AsyncHandler(SignUp));

router.post("/sign-out", AsyncHandler(SignOut));

router.get("/github", AsyncHandler(GithubAuth));
router.get("/github/callback", AsyncHandler(GithubCallback));

router.get("/me", AuthMiddleware, AsyncHandler(GetMEDetails));
router.post(
  "/change-password",
  AsyncHandler(AuthMiddleware),
  ChangePasswordInApp,
);

export default router;
