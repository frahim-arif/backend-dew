const express = require("express");

const {
  getCourses,
  getCourse,
  getCourseBySlug,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/trainingCourseController");

const router = express.Router();

// Public
router.get("/", getCourses);

// Slug Route (IMPORTANT: id route se pehle)
router.get("/slug/:slug", getCourseBySlug);

// Get by MongoDB ID
router.get("/:id", getCourse);

// Admin
router.post("/", createCourse);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

module.exports = router;