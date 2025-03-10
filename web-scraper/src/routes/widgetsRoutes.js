const express = require("express");
const router = express.Router();
const widgetsController = require("../controller/widgetsController");

router.get("/widgets", widgetsController.getWidgets);
router.put("/assign", widgetsController.assignWidgetsToClient);
router.get("/:clientId", widgetsController.getWidgetsByClient);

module.exports = router;
