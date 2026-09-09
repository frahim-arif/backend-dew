const Visitor = require("../models/Visitor");

exports.addVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findOneAndUpdate(
      { key: "home" },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      count: visitor.count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Visitor count update failed",
    });
  }
};

exports.getVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ key: "home" });

    res.status(200).json({
      success: true,
      count: visitor?.count || 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Visitor count fetch failed",
    });
  }
};