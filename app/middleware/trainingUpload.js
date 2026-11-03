const multer = require("multer");

const allowed = new Set(["application/pdf", "image/jpeg", "image/png"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (!allowed.has(file.mimetype)) return cb(new Error("Only PDF, JPG and PNG files are allowed."));
    cb(null, true);
  },
});

module.exports = upload.fields([
  { name: "doc_pg_degree", maxCount: 1 },
  { name: "doc_registration", maxCount: 1 },
  { name: "doc_photo_id", maxCount: 1 },
  { name: "doc_photo", maxCount: 1 },
  { name: "doc_logbook", maxCount: 1 },
]);
