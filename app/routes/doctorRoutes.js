const express = require("express");
const multer = require("multer");

const {
  CloudinaryStorage,
} = require("multer-storage-cloudinary");

const cloudinary = require("../../config/cloudinary");

const {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctorController");

const router = express.Router();

// ==================================================
// CLOUDINARY STORAGE
// ==================================================
const storage = new CloudinaryStorage({
  cloudinary,

  params: {
    folder: "dew-care/doctors",
    allowed_formats: [
      "jpg",
      "jpeg",
      "png",
      "webp",
    ],
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
// CREATE
// ==================================================
router.post(
  "/",
  upload.single("image"),
  createDoctor
);

// ==================================================
// GET ALL
// ==================================================
router.get(
  "/",
  getDoctors
);

// ==================================================
// GET SINGLE
// IMPORTANT: before /:id conflicts
// ==================================================
router.get(
  "/:id",
  getDoctorById
);

// ==================================================
// UPDATE
// ==================================================
router.put(
  "/:id",
  upload.single("image"),
  updateDoctor
);

// ==================================================
// DELETE
// ==================================================
router.delete(
  "/:id",
  deleteDoctor
);

module.exports = router;