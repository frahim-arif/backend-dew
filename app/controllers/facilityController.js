const fs = require("fs");
const path = require("path");
const Facility = require("../models/Facility");

const deleteFile = (filePath) => {
  if (!filePath) return;

  const fullPath = path.join(
    __dirname,
    "../../",
    filePath.replace("/", "")
  );

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

exports.createFacility = async (req, res) => {
  try {
    const facility = await Facility.create({
      title: req.body.title,
      desc: req.body.desc,
      icon: req.body.icon,
      category: req.body.category || "General",
      status: req.body.status || "Active",
      image: req.file ? `/uploads/${req.file.filename}` : "",
    });

    res.status(201).json({
      success: true,
      message: "Facility added",
      data: facility,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while adding facility",
    });
  }
};

exports.getFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: facilities.length,
      data: facilities,
    });
  } catch (error) {
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

    if (req.file) {
      deleteFile(facility.image);
      facility.image = `/uploads/${req.file.filename}`;
    }

    await facility.save();

    res.json({
      success: true,
      message: "Facility updated",
      data: facility,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while updating facility",
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

    deleteFile(facility.image);
    await facility.deleteOne();

    res.json({
      success: true,
      message: "Facility deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting facility",
    });
  }
};