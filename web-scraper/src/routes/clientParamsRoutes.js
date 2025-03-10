// routes/clientParamsRoutes.js
const express = require("express");
const router = express.Router();
const clientParamsController = require("../controller/clientParamsController");

// Example: GET /api/client-params/42
router.get("/:clientId", clientParamsController.getClientParams);

module.exports = router;
