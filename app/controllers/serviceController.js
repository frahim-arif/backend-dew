
const Service = require("../models/Service");

// ==================================================
// CREATE SERVICE
// ==================================================
exports.createService = async (req, res) => {
  try {
    const service = await Service.create({
      title: req.body.title,
      desc: req.body.desc,
      icon: req.body.icon,
      status: req.body.status || "Active",

      // Cloudinary image URL
      image: req.file ? req.file.path : "",
    });

    res.status(201).json({
      success: true,
      message: "Service added",
      data: service,
    });
  } catch (error) {
    console.error("CREATE SERVICE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error while adding service",
      error: error.message,
    });
  }
};

// ==================================================
// GET ALL SERVICES
// ==================================================
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    console.error("GET SERVICES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching services",
      error: error.message,
    });
  }
};

// ==================================================
// GET SINGLE SERVICE BY ID
// ==================================================
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("GET SERVICE BY ID ERROR:", error);

    // Invalid MongoDB ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching service",
      error: error.message,
    });
  }
};

// ==================================================
// UPDATE SERVICE
// ==================================================
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

    // New image uploaded
    if (req.file) {
      service.image = req.file.path;
    }

    await service.save();

    res.json({
      success: true,
      message: "Service updated",
      data: service,
    });
  } catch (error) {
    console.error("UPDATE SERVICE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating service",
      error: error.message,
    });
  }
};

// ==================================================
// DELETE SERVICE
// ==================================================
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    await service.deleteOne();

    res.json({
      success: true,
      message: "Service deleted",
    });
  } catch (error) {
    console.error("DELETE SERVICE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting service",
      error: error.message,
    });
  }
};

