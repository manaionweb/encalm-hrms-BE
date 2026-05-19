import { Router } from "express";
import { signup, login} from "../controllers/auth.controller";


import { authenticate } from "../middleware/auth.middleware";     
import { authorize } from "../middleware/authorize.middleware";  

// import { createUser } from "../controllers/user.controller";

const router = Router();

// public
router.post("/signup", signup);
router.post("/login", login);

// protected
router.post(
  "/create-user",
  authenticate,
  authorize("ADMIN"),
//   createUser
);

// create tenant
// router.post("/create-tenant", createTenant);
export default router;