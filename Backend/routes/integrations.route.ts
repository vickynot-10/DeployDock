import express from "express";
import { UpdateMailIntegration, UpdateWhatsappIntegration ,GetMailDetails, AutomationProviderStatus ,GetWhatsappDetails} from "../controllers/integrations.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
const router = express.Router();
import { AsyncHandler } from "../helpers/async.handler";
router.post("/whatsapp",AuthMiddleware ,AsyncHandler( UpdateWhatsappIntegration));
router.post("/mail",AuthMiddleware ,AsyncHandler( UpdateMailIntegration));
router.get("/mail",AuthMiddleware ,AsyncHandler( GetMailDetails)); 
router.get("/whatsapp",AuthMiddleware ,AsyncHandler( GetWhatsappDetails)); 
router.patch("/",AuthMiddleware ,AsyncHandler( AutomationProviderStatus));

export default router;
