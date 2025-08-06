//middleware/adminmiddlerware

const adminOnly = (req, res, next) => {
  if (req.user && req.user.email === "admin@getqrlinkz.com") {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

export { adminOnly };
