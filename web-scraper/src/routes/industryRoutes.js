const express = require("express");
const router = express.Router();
const industryController = require("../controller/industryController");

router.get("/industries", industryController.getIndustries);

module.exports = router;
