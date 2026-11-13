const PaymentAuditLog = require("../models/PaymentAuditLog");

exports.getPaymentAudits = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

    const { status, search } = req.query;

    const filter = {};

    if (status && status !== "ALL") {
      filter.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const keyword = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { razorpayOrderId: { $regex: keyword, $options: "i" } },
        { razorpayPaymentId: { $regex: keyword, $options: "i" } },
        { event: { $regex: keyword, $options: "i" } },
      ];

      if (/^[a-f\d]{24}$/i.test(search.trim())) {
        filter.$or.push({
          appointmentId: search.trim(),
        });
      }
    }

    const [transactions, total] = await Promise.all([
      PaymentAuditLog.find(filter)
        .select("-request -response -verification")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      PaymentAuditLog.countDocuments(filter),
    ]);

    const summary = await PaymentAuditLog.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ["$amountPaise", 0] } },
        },
      },
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
    });
  } catch (error) {
    console.error("Payment Audit Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load payment transactions",
    });
  }
};