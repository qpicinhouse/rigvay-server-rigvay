const Dealer = require("../models/dealer.model");
const DealerProfile = require("../models/dealerProfile.model");
const Subscription = require("../models/subscription.model");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const { ApiResponse } = require("../utils/ApiResponse");
function generateRegvayId() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

module.exports.createDealerProfile = async function dealerProfile(req, res, next) {
  try {
    const dealerId = req.user.id;
    const payload = req.body || {};
    const rigvay_id = req.user.rigvay_id ?? '';
    const dealer = await Dealer.findById(dealerId);
    if (!dealer)
      return res.status(404).json(new ApiResponse(404, "Dealer not found"));
    if (!rigvay_id)
      return res.status(404).json(new ApiResponse(404, "Rigvay ID not found"));

    let profile = await DealerProfile.findOne({ dealer: dealerId });
    if (!profile) profile = new DealerProfile({ dealer: dealerId });

    /* ---------------- profile image upload ---------------- */
    if (req.files?.profileImage?.[0]) {
      const result = await uploadOnCloudinary(req.files.profileImage[0].path);
      if (result?.secure_url) {
        profile.profileImageUrl = result.secure_url;
      }
    }
    /* ---------------- KYC document upload ---------------- */
    if (req.files && req.files.kycDocument && req.files.kycDocument.length > 0) {
      const file = req.files.kycDocument[0];

      if (file.path) {
        const result = await uploadOnCloudinary(file.path);
        if (result?.secure_url) {
          profile.kycDocument = result.secure_url;
        }
      }
    }
    // Set rigvay_id only if creating new profile, ignore if updating existing profile
    if (!profile.rigvay_id) {
      profile.rigvay_id = rigvay_id;
    }    
    // Map allowed flat fields from payload into profile (model uses flat address fields)
    const fields = [
      "firstName",
      "lastName",
      "phone",
      "email",
      "companyName",
      "aboutCompany",
      "companyPhone",
      "companyEmail",
      "companyWhatsapp",
      "addressLine1",
      "addressLine2",
      "addressLine3",
      "pincode",
      "district",
      "state",
      "website",
      "facebook",
      "instagram",
      "kycDocumentType",
      "kycDocumentNumber",

    ];
    fields.forEach((field) => {
      if (payload[field] !== undefined) {
        profile[field] = payload[field];
      }
    });

    // Validate required fields in a single if-block (matching DealerProfile schema)
    const requiredFields = [
      "firstName",
      "lastName",
      "companyName",
      "companyPhone",
      "companyEmail",
      "companyWhatsapp",
      "addressLine1",
      "addressLine2",
      "pincode",
      "district",
      "state",
      "kycDocumentType",
      "kycDocumentNumber",
      "kycDocument"
    ];

    const missing = requiredFields.filter((field) => {
      const val = profile[field] !== undefined ? profile[field] : payload[field];
      return val === undefined || val === null || String(val).trim() === "";
    });
    
    if (missing.length) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, "Missing required profile fields", { missing })
        );
    
    }
    
    await profile.save();

    // find active subscription
    const subscription = await Subscription.findOne({
      dealer: dealer._id,
      active: true,
    });

    const data = {
      dealer,
      profile,
      subscription: subscription || null,
    };

    return res.status(200).json(new ApiResponse(200, "Profile saved successfully", data));
  } catch (error) {
    next(error);
  }
};


module.exports.getDealerProfile = async function getDealerProfile(req, res, next) {
  try {
    console.log(req.user);
    const dealerId = req.user?.id;
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) return res.status(404).json(new ApiResponse(404, 'Dealer not found'));

    const profile = await DealerProfile.findOne({ dealer: dealerId });
    if (!profile) return res.status(201).json(new ApiResponse(404, 'Dealer profile not found'));

    const subscription = await Subscription.findOne({ dealer: dealer._id, active: true });

    return res.status(200).json(new ApiResponse(200, 'Profile fetched', { dealer, profile, subscription: subscription || null }));
  } catch (error) {
    next(error);
  }
};

module.exports.updateDealerProfile = async function updateDealerProfile(req, res, next) {
  try {
    const dealerId = req.user.id;
    const rigvay_id = req.user.rigvay_id ?? '';
    const payload = req.body || {};
    console.log("payload ",payload);

    const dealer = await Dealer.findById(dealerId);
    if (!dealer) return res.status(404).json(new ApiResponse(404, 'Dealer not found'));

    let profile = await DealerProfile.findOne({ dealer: dealerId });
    if (!profile.rigvay_id) {
      profile.rigvay_id = rigvay_id;
    } 
    if (!profile) return res.status(404).json(new ApiResponse(404, 'Dealer profile not found'));
    if (req.files?.profileImage?.[0]) {
      const result = await uploadOnCloudinary(req.files.profileImage[0].path);
      if (result?.secure_url) {
        profile.profileImageUrl = result.secure_url;
      }
    }
    /* ---------------- KYC document upload ---------------- */
    if (req.files && req.files.kycDocument && req.files.kycDocument.length > 0) {
      const file = req.files.kycDocument[0];

      if (file.path) {
        const result = await uploadOnCloudinary(file.path);
        if (result?.secure_url) {
          profile.kycDocument = result.secure_url;
        }
      }
    }
    const fields = [
      'firstName','lastName','phone','email','companyName','aboutCompany',
      'companyPhone','companyEmail','companyWhatsapp','addressLine1','addressLine2','addressLine3',
      'pincode','district','state','website','facebook','instagram',"kycDocumentType",
      "kycDocumentNumber"
    ];
    fields.forEach(field => {
      if (payload[field] !== undefined) profile[field] = payload[field];
    });

    const requiredFields = [
      'firstName','lastName','companyName',
      'companyPhone','companyEmail','companyWhatsapp',
      'addressLine1','addressLine2','pincode','district','state',"kycDocumentType",
      "kycDocumentNumber", "kycDocument"
    ];
    const missing = requiredFields.filter(field => {
      const val = profile[field] !== undefined ? profile[field] : payload[field];
      return val === undefined || val === null || String(val).trim() === '';
    });
    if (missing.length) {
      return res.status(400).json(new ApiResponse(400, 'Missing required profile fields', { missing }));
    }
    await profile.save();
    const subscription = await Subscription.findOne({ dealer: dealer._id, active: true });

    return res.status(200).json(new ApiResponse(200, 'Profile updated', { dealer, profile, subscription: subscription || null }));
  } catch (error) {
    next(error);
  }
};
