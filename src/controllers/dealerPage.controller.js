const DealerPage = require("../models/dealerPage.model");
const DealerProfile = require("../models/dealerProfile.model");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const { ApiResponse } = require("../utils/ApiResponse");


module.exports.getPage = async function getPage(req, res, next) {
    try {
        const dealerId = req.user.id;
        const rigvay_id = req.user.rigvay_id;
        if (!dealerId) {
            return res.status(401).json(new ApiResponse(401, "Unauthorized", null));
        }
        // Dealer basic info
        const dealerData = await DealerProfile.findOne({ dealer: dealerId }).select("firstName lastName companyName phone companyWhatsapp addressLine1 addressLine2 addressLine3 district state pincode profileImageUrl");
        if(!dealerData) return res.status(201).json(new ApiResponse(404, "Dealer profile is not updated"));
        const dealerPageData = await DealerPage.findOne({ dealer: dealerId }).select("bannerOneUrl bannerTwoUrl");
        const response = {
            name: `${dealerData.firstName} ${dealerData.lastName}`,
            companyLogoUrl: dealerData.profileImageUrl,
            companyName: dealerData.companyName,
            rigvayId: rigvay_id,
            mobileNumber: dealerData.phone,
            whatsappNumber: dealerData.companyWhatsapp,
            address: {
                line1: dealerData.addressLine1,
                line2: dealerData.addressLine2,
                line3: dealerData.addressLine3,
                district: dealerData.district,
                state: dealerData.state,
                pincode: dealerData.pincode,
            },
            bannerOneUrl: dealerPageData?.bannerOneUrl || null,
            bannerTwoUrl: dealerPageData?.bannerTwoUrl || null,
        };
        return res.status(200).json(
            new ApiResponse(200, "Dealer page fetched", response)
        );

    } catch (error) {
        return res.status(500).json(
            new ApiResponse(500, "Server error", null)
        );
    }
};


module.exports.updatePage = async function updatePage(req, res) {
    try {
        const dealerId = req.user.id;
        if (!dealerId) {
            return res.status(401).json(new ApiResponse(401, "Unauthorized", null));
        }
        let dealerPage = await DealerPage.findOne({ dealer: dealerId });

        const image1LocalPath = req.files?.bannerOneUrl?.[0]?.path;
        const image2LocalPath = req.files?.bannerTwoUrl?.[0]?.path;

        let bannerOneUrl = dealerPage?.bannerOneUrl || "";
        let bannerTwoUrl = dealerPage?.bannerTwoUrl || "";

        if (image1LocalPath) {
            const upload1 = await uploadOnCloudinary(image1LocalPath);
            bannerOneUrl = upload1?.secure_url;
        }

        if (image2LocalPath) {
            const upload2 = await uploadOnCloudinary(image2LocalPath);
            bannerTwoUrl = upload2?.secure_url;
        }

        //UPDATE
        if (dealerPage) {
            dealerPage.bannerOneUrl = bannerOneUrl;
            dealerPage.bannerTwoUrl = bannerTwoUrl;
            await dealerPage.save();
        }
        //CREATE
        else {
            if (!bannerOneUrl) {
                return res.status(400).json(
                    new ApiResponse(400, "Banner One image is required", null)
                );
            }
            dealerPage = await DealerPage.create({
                dealer: dealerId,
                bannerOneUrl,
                bannerTwoUrl,
            });
        }

        return res.status(200).json(
            new ApiResponse(200, "Page saved successfully", dealerPage)
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json(
            new ApiResponse(500, "Server error", null)
        );
    }
};
