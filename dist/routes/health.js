import { Router } from "express";
const router = Router();
router.get("/", async (req, res) => {
    console.log("health check");
    res.json({ ok: true, message: "Ok lets go!" });
});
export { router as healthRouter };
