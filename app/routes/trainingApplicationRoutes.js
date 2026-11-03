const router = require("express").Router();
const controller = require("../controllers/trainingApplicationController");
const trainingUpload = require("../middleware/trainingUpload");

// Public application + batch availability
router.get("/batches", controller.getBatches);
router.post("/", trainingUpload, controller.createApplication);

// Existing admin endpoints retained (keep your existing admin auth middleware here).
router.get("/stats", controller.getStats);
router.get("/", controller.getApplications);
router.get("/:id", controller.getApplication);
router.put("/:id", controller.updateApplication);
router.patch("/:id/status", controller.updateApplicationStatus);
router.delete("/:id", controller.deleteApplication);
module.exports = router;
