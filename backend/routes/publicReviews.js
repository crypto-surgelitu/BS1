const express = require("express");
const router = express.Router();
const { dbPromise } = require("../config/db");

router.post("/", async (req, res) => {
    const { rating, label, roomName } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
    if (!label || !roomName) {
        return res.status(400).json({ error: "Label and room name are required" });
    }
    
    try {
        await dbPromise.query(
            "INSERT INTO reviews (rating, comment, room_name, status, created_at) VALUES (?, ?, ?, ?, NOW())",
            [rating, label, roomName, "published"]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Error creating public review:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
