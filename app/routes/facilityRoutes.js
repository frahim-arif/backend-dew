const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudinary = require("../../config/cloudinary");

const {
  createFacility,
  getFacilities,
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

router.post("/", upload.single("image"), createFacility);

router.get("/", getFacilities);

router.put("/:id", upload.single("image"), updateFacility);

router.delete("/:id", deleteFacility);

module.exports = router;