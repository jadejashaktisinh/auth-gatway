import { Router } from "express";
import {
  handleClientRegistration,
  handleClientRouteCreation,
} from "../controllers/clients.controller.js";
import {
  clientRegisterValidator,
  clientRoutesValidator,
} from "../middleware/clients.middleware.js";

const router: Router = Router();

router.post(
  "/client/register",
  clientRegisterValidator,
  handleClientRegistration,
);

router.post(
  "/client/:clientid/routes",
  clientRoutesValidator,
  handleClientRouteCreation,
);
export default router;
