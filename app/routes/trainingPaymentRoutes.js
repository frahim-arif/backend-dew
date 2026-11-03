const router = require("express").Router();
const controller = require("../controllers/trainingApplicationController");
router.post("/verify", controller.verifyPayment);
module.exports = router;
