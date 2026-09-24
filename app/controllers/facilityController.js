const Facility = require("../models/Facility");

exports.createFacility = async (req, res) => {
  try {
    const facility = await Facility.create({
      title: req.body.title,
      desc: req.body.desc,
      icon: req.body.icon,
      category: req.body.category || "General",
      status: req.body.status || "Active",

      // Cloudinary image URL
      image: req.file ? req.file.path : "",
    });

    res.status(201).json({
      success: true,
      message: "Facility added",
      data: facility,
    });
  } catch (error) {
    console.error("CREATE FACILITY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error while adding facility",
      error: error.message,
    });
  }
};

exports.getFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: facilities.length,
      data: facilities,
    });
  } catch (error) {
    console.error("GET FACILITIES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching facilities",
    });
  }
};

exports.updateFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    facility.title = req.body.title;
    facility.desc = req.body.desc;
    facility.icon = req.body.icon;
    facility.category = req.body.category || facility.category;
    facility.status = req.body.status || facility.status;

    // New image uploaded
    if (req.file) {
      facility.image = req.file.path;
    }

    await facility.save();

    res.json({
      success: true,
      message: "Facility updated",
      data: facility,
    });
  } catch (error) {
    console.error("UPDATE FACILITY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating facility",
      error: error.message,
    });
  }
};

exports.deleteFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    await facility.deleteOne();

    res.json({
      success: true,
      message: "Facility deleted",
    });
  } catch (error) {
    console.error("DELETE FACILITY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting facility",
      error: error.message,
    });
  }
};