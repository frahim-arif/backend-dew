const TrainingCourse = require("../models/TrainingCourse");

const makeSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

// ======================
// Get All Courses
// ======================

const getCourses = async (req, res) => {
  try {
    const courses = await TrainingCourse.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================
// Get Single Course
// ======================

const getCourse = async (req, res) => {
  try {
    const course = await TrainingCourse.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================
// Create Course
// ======================

const createCourse = async (req, res) => {
  try {
    const body = req.body;

    const course = await TrainingCourse.create({
      title: body.title,
      slug: makeSlug(body.title),
      shortDescription: body.shortDescription,
      description: body.description,
      duration: body.duration,
      fees: body.fees,
      eligibility: body.eligibility,
      instructor: body.instructor,
      seats: body.seats,
      featured: body.featured,
      status: body.status || "Active",
      image: body.image || "",
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ======================
// Get Course By Slug
// ======================

const getCourseBySlug = async (req, res) => {
  try {
    const course = await TrainingCourse.findOne({
      slug: req.params.slug,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// ======================
// Update Course
// ======================

const updateCourse = async (req, res) => {
  try {
    const body = req.body;

    const updateData = {
      ...body,
    };

    if (body.title) {
      updateData.slug = makeSlug(body.title);
    }

    if (body.image) {
      updateData.image = body.image;
    }

    const course = await TrainingCourse.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================
// Delete Course
// ======================

const deleteCourse = async (req, res) => {
  try {
    const course = await TrainingCourse.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getCourses,
  getCourse,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
};