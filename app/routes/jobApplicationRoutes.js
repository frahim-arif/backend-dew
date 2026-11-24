
const express = require("express");
const router = express.Router();

const {
  createJobApplication,
} = require("../controllers/jobApplicationController");

router.post("/", createJobApplication);

module.exports = router;
