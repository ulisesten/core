function reject(res, status, message) {
  res.status(status).json({
    msg: message,
    error: 1,
    success: false
  });
}

module.exports = {
  reject
};