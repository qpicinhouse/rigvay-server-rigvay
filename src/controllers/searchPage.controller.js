const Car = require("../models/Car.model");
const { ApiResponse } = require("../utils/ApiResponse");
const caseInsensitiveIn = (value) =>
  value.split(",").map(v => new RegExp(`^${v}$`, "i"));

module.exports.getSearchResults = async (req, res) => {
    try {
        const {
            search,
            brand,
            location,
            state,
            year,
            fuelType,
            transmission,
            type,
            minPrice,
            maxPrice,
            minMileage,
            maxMileage,
            minDistance,
            maxDistance,
            seats,
            airbags,
            alloyWheels,
            sort,
            page = 1,
            limit = 4
        } = req.query;

        /* ---------------- PAGINATION ---------------- */
        const currentPage = Number(page);
        const pageLimit = Number(limit);
        const skip = (currentPage - 1) * pageLimit;

        /* ---------------- BASE FILTER ---------------- */
        let filter = {};
        //temporary comment out to show all cars including non-live cars
        filter = {
          status: "live",
          isDeleted: false
        };

        /* ---------------- SEARCH ---------------- */
        if (search) {
            filter.$or = [
                { brand: { $regex: search, $options: "i" } },
                { model: { $regex: search, $options: "i" } }
            ];
        }
         /* ---------------- BRAND ---------------- */
        if (brand) {
            filter.brand = { $regex: brand, $options: "i" };
        }
        /* ---------------- LOCATION ---------------- */
        if (location) filter["location"] = { $regex: location, $options: "i" };
        // if (state) filter["location.state"] = { $regex: state, $options: "i" };

        /* ---------------- MODEL YEAR ---------------- */
        if (year) {
            filter.year = { $in: year.split(",").map(Number) };
        }

        /* ---------------- FUEL TYPE ---------------- */
        if (fuelType) {
            filter.fuelType = { $in: caseInsensitiveIn(fuelType) };
        }

        /* ---------------- TRANSMISSION ---------------- */
        if (transmission) {
            filter.transmission = { $in: caseInsensitiveIn(transmission) };
        }

        /* ---------------- Type TYPE ---------------- */
        if (type) {
            filter.type = { $in: caseInsensitiveIn(type) };
        }

        /* ---------------- PRICE ---------------- */
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        /* ---------------- MILEAGE ---------------- */
        if (minMileage || maxMileage) {
            filter.mileage = {};
            if (minMileage) filter.mileage.$gte = Number(minMileage);
            if (maxMileage) filter.mileage.$lte = Number(maxMileage);
        }

        /* ---------------- DISTANCE ---------------- */
        if (minDistance || maxDistance) {
            filter.distance = {};
            if (minDistance) filter.distance.$gte = Number(minDistance);
            if (maxDistance) filter.distance.$lte = Number(maxDistance);
        }

        /* ---------------- SEATS ---------------- */
        if (seats) {
            filter["interiorEquipment.numberOfSeats"] = Number(seats);
        }

        /* ---------------- AIRBAGS ---------------- */
        if (airbags) {
            filter["interiorEquipment.airbags"] = Number(airbags);
        }

        /* ---------------- ALLOY WHEELS ---------------- */
        if (alloyWheels === "true") {
            filter["exteriorEquipment.alloyWheels"] = true;
        }

        /* ---------------- SORT ---------------- */
        let sortOption = { createdAt: -1 };

        if (sort === "price_low") sortOption = { price: 1 };
        if (sort === "price_high") sortOption = { price: -1 };
        if (sort === "year_new") sortOption = { year: -1 };
        if (sort === "year_old") sortOption = { year: 1 };

        /* ---------------- QUERY ---------------- */
        const [cars, totalCars] = await Promise.all([
            Car.find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(pageLimit)
                .select("-vin -__v"),

            Car.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalCars / pageLimit);

        return res.status(200).json(
            new ApiResponse(200, "Search results fetched successfully",{

                pagination: {
                    totalCars,
                    totalPages,
                    currentPage,
                    limit: pageLimit,
                    hasNextPage: currentPage < totalPages,
                    hasPrevPage: currentPage > 1
                }
                , cars
            })
        );

    } catch (error) {
        console.error("SEARCH ERROR:", error);
        return res
            .status(500)
            .json(new ApiResponse(500, null, "Search failed"));
    }
};


// ==================>> GET RECENTLY ADDED 6 CARS << ========================= 
module.exports.getRecentlyAddedCars = async (req, res) => {
    try {
        const cars = await Car.find({
            status: "live",
            isDeleted: false
        }).sort({ createdAt: -1 })
            .limit(6)

        return res
            .status(200)
            .json(new ApiResponse(200, "Recently added 6 cars fetched", {cars}));
    } catch (error) {
        console.error("RECENT CARS ERROR:", error);
        return res
            .status(500)
            .json(new ApiResponse(500, null, "Failed to fetch recent cars"));
    }
};

