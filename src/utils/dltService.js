// Placeholder DLT/SMS sender. Replace the body of `sendSMS` with your provider's API call.
const axios = require("axios");
async function sendSMS(phone, otp) {
  try {
    const url = "https://pgapi.smartping.ai/fe/api/v1/send";

    const params = new URLSearchParams({
      username: "rigvaycars.trans",
      password: "llJRI",
      unicode: "false",
      from: "RIGVAY",
      to: phone, // example: 916295496045
      dltContentId: "1707176543736737919",
      dltPrincipalEntityId: "1701176415997908826",
      text: `${otp} is your One Time Verification (OTP) to confirm your phone no at Rigvay`
    });

    const response = await axios.post(url, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      }
    });
    if (response.statusCode === 200) {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        error: `Failed to send SMS, status code: ${response.status}`
      };
    }
  } catch (error) {
    console.error("SMS Error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
}


module.exports.sendOTPViaDLT = async function sendOTPViaDLT(phone, otp) {
  const phone_num = 91 + phone;
  return sendSMS(phone_num, otp);
}
