const express = require("express");
const router = express.Router();

const {
  addVisitor,
  getVisitor,
} = require("../controllers/visitorController");

router.post("/", addVisitor);
router.get("/", getVisitor);

module.exports = router;