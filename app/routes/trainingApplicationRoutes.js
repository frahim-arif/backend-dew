const express = require("express");

const {
  getApplications,
  createApplication,
  getApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  getApplicationStats,
} = require("../controllers/trainingApplicationController");

// const { protect, adminOnly } = require("../middleware/authMiddleware");
// const upload = require("../middleware/upload");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

router.get(
  "/stats",
  // protect,
  // adminOnly,
  getApplicationStats
);

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  // upload.single("photo"),
  createApplication
);

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  // protect,
  // adminOnly,
  getApplications
);

router.get(
  "/:id",
  // protect,
  // adminOnly,
  getApplication
);

router.put(
  "/:id",
  // protect,
  // adminOnly,
  updateApplication
);

router.patch(
  "/:id/status",
  // protect,
  // adminOnly,
  updateApplicationStatus
);

router.delete(
  "/:id",
  // protect,
  // adminOnly,
  deleteApplication
);

module.exports = router;