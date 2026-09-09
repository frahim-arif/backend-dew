const fs = require("fs");
const path = require("path");
const Service = require("../models/Service");

const deleteFile = (filePath) => {
  if (!filePath) return;

  const fullPath = path.join(__dirname, "../../", filePath.replace("/", ""));

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

exports.createService = async (req, res) => {
  try {
    const service = await Service.create({
      title: req.body.title,
      desc: req.body.desc,
      icon: req.body.icon,
      status: req.body.status || "Active",
      image: req.file ? `/uploads/${req.file.filename}` : "",
    });

    res.status(201).json({
      success: true,
      message: "Service added",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while adding service",
    });
  }
};

exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching services",
    });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    service.title = req.body.title;
    service.desc = req.body.desc;
    service.icon = req.body.icon;
    service.status = req.body.status || service.status;

    if (req.file) {
      deleteFile(service.image);
      service.image = `/uploads/${req.file.filename}`;
    }

    await service.save();

    res.json({
      success: true,
      message: "Service updated",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while updating service",
    });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    deleteFile(service.image);
    await service.deleteOne();

    res.json({
      success: true,
      message: "Service deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting service",
    });
  }
};