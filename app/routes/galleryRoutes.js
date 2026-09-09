const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  createGallery,
  getGallery,
  updateGallery,
  deleteGallery,
} = require("../controllers/galleryController");

const router = express.Router();

// ===========================
// Multer Storage
// ===========================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
  },
});

// ===========================
// File Filter
// ===========================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, PNG, WEBP & GIF images are allowed."
      ),
      false
    );
  }
};

// ===========================
// Multer Upload
// ===========================

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// ===========================
// Routes
// ===========================

// Create Gallery
router.post(
  "/",
  upload.single("image"),
  createGallery
);

// Get All Gallery
router.get("/", getGallery);

// Update Gallery
router.put(
  "/:id",
  upload.single("image"),
  updateGallery
);

// Delete Gallery
router.delete("/:id", deleteGallery);

module.exports = router;