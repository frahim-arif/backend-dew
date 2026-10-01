const fs = require("fs");
const path = require("path");
const Gallery = require("../models/Gallery");

// ======================================================
// Helper: Delete Image File
// ======================================================

const deleteImageFile = (imagePath) => {
  if (!imagePath) return;

  const oldPath = path.join(
    __dirname,
    "../../",
    imagePath.replace(/^\/+/, "")
  );

  try {
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  } catch (error) {
    console.error(
      "Error deleting image:",
      error
    );
  }
};

// ======================================================
// CREATE GALLERY
// ======================================================

exports.createGallery = async (req, res) => {
  try {
    const {
      title,
      type,
      category,
      status,
      description,
      featured,
      displayOrder,
      youtubeUrl,
      facebookUrl,
    } = req.body;

    // =========================
    // Title Validation
    // =========================

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Gallery title is required",
      });
    }

    // =========================
    // Type Validation
    // =========================

    if (
      !["image", "video", "facebook"].includes(
        type
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery type",
      });
    }

    // =========================
    // IMAGE VALIDATION
    // =========================

    if (type === "image" && !req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    // =========================
    // YOUTUBE VALIDATION
    // =========================

    if (
      type === "video" &&
      !youtubeUrl?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter YouTube URL",
      });
    }

    // =========================
    // FACEBOOK VALIDATION
    // =========================

    if (
      type === "facebook" &&
      !facebookUrl?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter Facebook Video URL",
      });
    }

    // =========================
    // CREATE
    // =========================

    const gallery = await Gallery.create({
      title: title.trim(),

      type,

      // Image
      image:
        type === "image" && req.file
          ? `/uploads/${req.file.filename}`
          : "",

      // YouTube
      youtubeUrl:
        type === "video"
          ? youtubeUrl.trim()
          : "",

      // Facebook
      facebookUrl:
        type === "facebook"
          ? facebookUrl.trim()
          : "",

      category,

      status,

      description:
        description?.trim() || "",

      featured:
        featured === "true" ||
        featured === true,

      displayOrder:
        Number(displayOrder) || 0,
    });

    return res.status(201).json({
      success: true,
      message:
        "Gallery created successfully",
      data: gallery,
    });
  } catch (error) {
    console.error(
      "Create Gallery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ======================================================
// GET ALL GALLERY
// ======================================================

exports.getGallery = async (req, res) => {
  try {
    const gallery = await Gallery.find().sort({
      displayOrder: 1,
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: gallery.length,
      data: gallery,
    });
  } catch (error) {
    console.error(
      "Get Gallery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ======================================================
// UPDATE GALLERY
// ======================================================

exports.updateGallery = async (req, res) => {
  try {
    const gallery =
      await Gallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    const {
      title,
      type,
      category,
      status,
      description,
      featured,
      displayOrder,
      youtubeUrl,
      facebookUrl,
    } = req.body;

    // =========================
    // Basic Fields
    // =========================

    gallery.title =
      title?.trim() || gallery.title;

    gallery.type =
      type || gallery.type;

    gallery.category =
      category || gallery.category;

    gallery.status =
      status || gallery.status;

    gallery.description =
      description?.trim() || "";

    gallery.featured =
      featured === true ||
      featured === "true";

    gallery.displayOrder =
      Number(displayOrder) || 0;

    // =========================
    // TYPE VALIDATION
    // =========================

    if (
      !["image", "video", "facebook"].includes(
        gallery.type
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery type",
      });
    }

    // ==================================================
    // IMAGE
    // ==================================================

    if (gallery.type === "image") {
      // Remove URLs
      gallery.youtubeUrl = "";
      gallery.facebookUrl = "";

      // New image uploaded
      if (req.file) {
        // Delete old image
        if (gallery.image) {
          deleteImageFile(
            gallery.image
          );
        }

        gallery.image =
          `/uploads/${req.file.filename}`;
      }

      // Existing image check
      if (!gallery.image) {
        return res.status(400).json({
          success: false,
          message:
            "Please upload an image",
        });
      }
    }

    // ==================================================
    // YOUTUBE VIDEO
    // ==================================================

    if (gallery.type === "video") {
      if (!youtubeUrl?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter YouTube URL",
        });
      }

      // Delete old image
      if (gallery.image) {
        deleteImageFile(
          gallery.image
        );
      }

      gallery.image = "";

      // Clear Facebook
      gallery.facebookUrl = "";

      // Save YouTube
      gallery.youtubeUrl =
        youtubeUrl.trim();
    }

    // ==================================================
    // FACEBOOK VIDEO
    // ==================================================

    if (gallery.type === "facebook") {
      if (!facebookUrl?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter Facebook Video URL",
        });
      }

      // Delete old image
      if (gallery.image) {
        deleteImageFile(
          gallery.image
        );
      }

      gallery.image = "";

      // Clear YouTube
      gallery.youtubeUrl = "";

      // Save Facebook URL
      gallery.facebookUrl =
        facebookUrl.trim();
    }

    // =========================
    // SAVE
    // =========================

    await gallery.save();

    return res.json({
      success: true,
      message:
        "Gallery updated successfully",
      data: gallery,
    });
  } catch (error) {
    console.error(
      "Update Gallery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ======================================================
// DELETE GALLERY
// ======================================================

exports.deleteGallery = async (req, res) => {
  try {
    const gallery =
      await Gallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    // =========================
    // Delete Image
    // =========================

    if (
      gallery.type === "image" &&
      gallery.image
    ) {
      deleteImageFile(
        gallery.image
      );
    }

    // =========================
    // Delete DB Record
    // =========================

    await Gallery.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Gallery deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Gallery Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};