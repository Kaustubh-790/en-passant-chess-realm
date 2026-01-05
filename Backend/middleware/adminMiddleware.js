export const admin = (req, res, next) => {
  try {
    const adminSecret = req.headers["admin-secret"];

    if (!adminSecret) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Admin header missing.",
      });
    }

    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({
        success: false,
        message: "Access Denied: Invalid Admin secret.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin Auth Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error during Admin authentication.",
    });
  }
};
