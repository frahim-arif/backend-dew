const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getPaymentAudits } = require("../controllers/adminController");

const router = express.Router();

router.get("/payment-audits", authMiddleware, getPaymentAudits);

module.exports = router;