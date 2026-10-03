const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../../config/cloudinary");

const {
  createFacility,
  getFacilities,
  getFacilityById,
  updateFacility,
  deleteFacility,
} = require("../controllers/facilityController");

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "dew-care/facilities",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ===============================
// CREATE FACILITY
// POST /api/facilities
// ===============================
router.post("/", upload.single("image"), createFacility);

// ===============================
// GET ALL FACILITIES
// GET /api/facilities
// ===============================
router.get("/", getFacilities);

// ===============================
// GET SINGLE FACILITY
// GET /api/facilities/:id
// ===============================
router.get("/:id", getFacilityById);

// ===============================
// UPDATE FACILITY
// PUT /api/facilities/:id
// ===============================
router.put("/:id", upload.single("image"), updateFacility);

// ===============================
// DELETE FACILITY
// DELETE /api/facilities/:id
// ===============================
router.delete("/:id", deleteFacility);

module.exports = router;