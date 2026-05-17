import { Router } from "express";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/:id/premium", async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await db
      .select({
        isPremium: users.isPremium,
        isPremiumPlus: users.isPremiumPlus,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user premium status");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
