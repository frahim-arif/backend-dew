const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  createFacility,
  getFacilities,
  updateFacility,
  deleteFacility,
} = require("../controllers/facilityController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG and PNG images are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/", upload.single("image"), createFacility);
router.get("/", getFacilities);
router.put("/:id", upload.single("image"), updateFacility);
router.delete("/:id", deleteFacility);

module.exports = router;