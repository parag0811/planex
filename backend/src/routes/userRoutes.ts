import { Router } from "express";
import { createUser, deleteUser, fetchUsers, showUser, updateUser } from "../controller/userController";

const router = Router();

router.get("/", fetchUsers);

router.get("/:id", showUser);

router.post("/", createUser);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);

export default router;
