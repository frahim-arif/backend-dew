const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../../config/cloudinary");

const {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
} = require("../controllers/serviceController");

const router = express.Router();

// ==================================================
// CLOUDINARY STORAGE
// ==================================================
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "dew-care/services",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

// ==================================================
// MULTER
// ==================================================
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ==================================================
// SERVICE ROUTES
// ==================================================

// Create service
router.post("/", upload.single("image"), createService);

// Get all services
router.get("/", getServices);

// Get single service by ID
router.get("/:id", getServiceById);

// Update service
router.put("/:id", upload.single("image"), updateService);

// Delete service
router.delete("/:id", deleteService);

module.exports = router;