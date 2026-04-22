const express = require("express");
const router = express.Router();

const controller = require("./activity.controller");

// 🔥 IMPORTANT → must be POST
router.post("/", controller.create);

// GET all
router.get("/", controller.getAll);

// UPDATE
router.put("/:id", controller.update);

// DELETE
router.delete("/:id", controller.remove);

module.exports = router;