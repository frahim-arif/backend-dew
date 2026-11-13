
const PaymentAuditLog = require("../models/PaymentAuditLog");

// Sensitive fields ko API response se hide karna
const SENSITIVE_KEYS = [
  "key_secret",
  "keysecret",
  "secret",
  "password",
  "authorization",
  "access_token",
  "refresh_token",
  "razorpay_signature",
  "signature",
  "api_key",
  "apikey",
];

const redactSensitiveData = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(redactSensitiveData);
  }

  if (typeof value === "object") {
    const safeObject = {};

    for (const [key, item] of Object.entries(value)) {
      if (
        SENSITIVE_KEYS.includes(key.toLowerCase()) ||
        key.toLowerCase().includes("secret")
      ) {
        safeObject[key] = "[REDACTED]";
      } else {
        safeObject[key] = redactSensitiveData(item);
      }
    }

    return safeObject;
  }

  return value;
};

// GET /api/admin/payment-audits
exports.getPaymentAudits = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100
    );

    const status = (req.query.status || "ALL").toUpperCase();
    const search = (req.query.search || "").trim();

    const filter = {};

    if (status !== "ALL") {
      filter.status = status;
    }

    if (search) {
      const keyword = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        {
          razorpayOrderId: {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          razorpayPaymentId: {
            $regex: keyword,
            $options: "i",
          },
        },
        {
          event: {
            $regex: keyword,
            $options: "i",
          },
        },
      ];

      if (/^[a-f\d]{24}$/i.test(search)) {
        filter.$or.push({
          appointmentId: search,
        });
      }
    }

    const [transactions, total, summary] = await Promise.all([
      PaymentAuditLog.find(filter)
        .select("-request -response -verification")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      PaymentAuditLog.countDocuments(filter),

      PaymentAuditLog.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            amountPaise: {
              $sum: {
                $ifNull: ["$amountPaise", 0],
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
      summary,
    });
  } catch (error) {
    console.error("Payment Audit Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load payment transactions",
    });
  }
};

// GET /api/admin/payment-audits/:appointmentId/logs
exports.getPaymentAuditDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (!/^[a-f\d]{24}$/i.test(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }

    const logs = await PaymentAuditLog.find({
      appointmentId,
    })
      .sort({
        createdAt: 1,
        _id: 1,
      })
      .lean();

    if (!logs.length) {
      return res.status(404).json({
        success: false,
        message: "No payment audit logs found for this appointment",
      });
    }

    const safeLogs = logs.map((log) => redactSensitiveData(log));

    return res.status(200).json({
      success: true,
      appointmentId,
      totalLogs: safeLogs.length,
      logs: safeLogs,
    });
  } catch (error) {
    console.error("Payment Audit Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load payment audit details",
    });
  }
};
