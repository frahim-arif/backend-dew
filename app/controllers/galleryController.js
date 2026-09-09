const fs = require("fs");
const path = require("path");
const Gallery = require("../models/Gallery");

// =======================
// Create Gallery
// =======================

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
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Gallery title is required",
      });
    }

    if (type === "image" && !req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    if (type === "video" && !youtubeUrl?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter YouTube URL",
      });
    }

    const gallery = await Gallery.create({
      title: title.trim(),

      type,

      image:
        type === "image"
          ? `/uploads/${req.file.filename}`
          : "",

      youtubeUrl:
        type === "video"
          ? youtubeUrl.trim()
          : "",

      category,

      status,

      description,

      featured:
        featured === "true" ||
        featured === true,

      displayOrder:
        Number(displayOrder) || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Gallery created successfully",
      data: gallery,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =======================
// Get Gallery
// =======================

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
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// =======================
// Update Gallery
// =======================

exports.updateGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);

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
    } = req.body;

    // Basic Fields
    gallery.title = title?.trim() || gallery.title;
    gallery.type = type || gallery.type;
    gallery.category = category || gallery.category;
    gallery.status = status || gallery.status;
    gallery.description = description || "";
    gallery.featured =
      featured === true || featured === "true";
    gallery.displayOrder =
      Number(displayOrder) || 0;

    // ======================
    // IMAGE
    // ======================

    if (gallery.type === "image") {
      // Remove old youtube url
      gallery.youtubeUrl = "";

      if (req.file) {
        // Delete old image
        if (gallery.image) {
          const oldPath = path.join(
            __dirname,
            "../../",
            gallery.image.replace("/", "")
          );

          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        gallery.image = `/uploads/${req.file.filename}`;
      }

      if (!gallery.image) {
        return res.status(400).json({
          success: false,
          message: "Please upload image",
        });
      }
    }

    // ======================
    // VIDEO
    // ======================

    if (gallery.type === "video") {
      if (!youtubeUrl?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Please enter YouTube URL",
        });
      }

      // Delete old image if exists
      if (gallery.image) {
        const oldPath = path.join(
          __dirname,
          "../../",
          gallery.image.replace("/", "")
        );

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      gallery.image = "";
      gallery.youtubeUrl = youtubeUrl.trim();
    }

    await gallery.save();

    return res.json({
      success: true,
      message: "Gallery updated successfully",
      data: gallery,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// =======================
// Delete Gallery
// =======================

exports.deleteGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    // Delete uploaded image only
    if (
      gallery.type === "image" &&
      gallery.image
    ) {
      const imagePath = path.join(
        __dirname,
        "../../",
        gallery.image.replace("/", "")
      );

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Gallery.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Gallery deleted successfully",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};