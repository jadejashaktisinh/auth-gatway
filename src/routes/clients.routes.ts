import { Router } from "express";
import { handleClientRegistration, handleClientRouteCreation } from "../controllers/clients.controller.js";

const router: Router = Router();

router.post(
  "/client/register",
  handleClientRegistration,
);

router.post(
  "/client/:clientid/routes",
  handleClientRouteCreation,
);
export default router;
