const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudinary = require("../../config/cloudinary");

const {
  createService,
  getServices,
  updateService,
  deleteService,
} = require("../controllers/serviceController");

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "dew-care/services",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post("/", upload.single("image"), createService);

router.get("/", getServices);

router.put("/:id", upload.single("image"), updateService);

router.delete("/:id", deleteService);

module.exports = router;