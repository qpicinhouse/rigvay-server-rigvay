const DealerPage = require("../models/dealerPage.model");
const DealerProfile = require("../models/dealerProfile.model");
const { uploadToS3 } = require("../utils/s3");
const { ApiResponse } = require("../utils/ApiResponse");
const Car = require("../models/Car.model");
const Dealer = require("../models/dealer.model");


module.exports.getPage = async function getPage(req, res, next) {
    try {
        const dealerId = req.user.id;
        const rigvay_id = req.user.rigvay_id;
        if (!dealerId) {
            return res.status(401).json(new ApiResponse(401, "Unauthorized", null));
        }
        // Dealer basic info
        const dealerData = await DealerProfile.findOne({ dealer: dealerId }).select("profileImageUrl firstName lastName companyName phone companyWhatsapp addressLine1 addressLine2 addressLine3 district state pincode profileImageUrl");
        if (!dealerData) return res.status(201).json(new ApiResponse(404, "Dealer profile is not updated"));
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

        const image1LocalPath = req.files?.bannerOneUrl?.[0];
        const image2LocalPath = req.files?.bannerTwoUrl?.[0];

        let bannerOneUrl = dealerPage?.bannerOneUrl || "";
        let bannerTwoUrl = dealerPage?.bannerTwoUrl || "";

        if (image1LocalPath) {
            const upload1 = await uploadToS3(image1LocalPath.buffer, image1LocalPath.mimetype, image1LocalPath.originalname);
            bannerOneUrl = upload1?.secure_url;
        }

        if (image2LocalPath) {
            const upload2 = await uploadToS3(image2LocalPath.buffer, image2LocalPath.mimetype, image2LocalPath.originalname);
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


module.exports.getPublicDealerPage = async (req, res) => {
    try {
        const { rigvay_id } = req.params;

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const skip = (page - 1) * limit;

        const dealer = await Dealer.findOne({ rigvay_id }).select("_id rigvay_id");
        if (!dealer) {
            return res
                .status(404)
                .json(new ApiResponse(404, "Dealer not found"));
        }

        const dealerData = await DealerProfile.findOne({ dealer: dealer._id }).select(
            "profileImageUrl firstName lastName companyName phone companyWhatsapp addressLine1 addressLine2 addressLine3 district state pincode"
        );

        if (!dealerData) {
            return res.status(201).json(
                new ApiResponse(201, "Dealer profile is not updated")
            );
        }

        const dealerPageData = await DealerPage.findOne({ dealer: dealer._id }).select(
            "bannerOneUrl bannerTwoUrl"
        );

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

        const [cars, totalCars] = await Promise.all([
            Car.find({
                dealer: dealer._id,
                isDeleted: false,
                status: "live",
            })
                .sort({ postedAt: -1 })
                .skip(skip)
                .limit(limit),

            Car.countDocuments({
                dealer: dealer._id,
                isDeleted: false,
                status: "live",
            }),
        ]);

        // Response
        return res.status(200).json(
            new ApiResponse(200, "Dealer public page", {
                dealer: {
                    rigvay_id: dealer.rigvay_id,
                },
                profile: response,
                cars,
                pagination: {
                    page,
                    limit,
                    totalCars,
                    totalPages: Math.ceil(totalCars / limit),
                },
            })
        );
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json(new ApiResponse(500, "Internal Server error"));
    }
};
