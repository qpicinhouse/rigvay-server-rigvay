module.exports.generateOTP = function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) otp += digits[Math.floor(Math.random() * 10)];
  return otp;
}

module.exports.otpExpiry = function otpExpiry(minutes = 5) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
