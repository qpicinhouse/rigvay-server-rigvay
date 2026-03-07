const CarProducer = require("../models/CarProducer.model");
const { ApiResponse } = require("../utils/ApiResponse");

// In-memory cache for the optimized flat dictionary
let flatProducersCache = null;

// Helper function to rebuild the in-memory cache
const rebuildCache = async () => {
    try {
        console.log("Rebuilding CarProducers flat cache...");
        const producers = await CarProducer.find().select("name models -_id").lean();
        const flatDict = {};
        
        producers.forEach(p => {
            flatDict[p.name] = p.models || [];
        });
        
        flatProducersCache = flatDict;
        return flatDict;
    } catch (error) {
        console.error("Failed to rebuild producers cache:", error);
    }
};

// ==========================================
// PUBLIC: Get Flattened Dictionary (Ultra Fast)
// ==========================================
module.exports.getFlatProducers = async (req, res) => {
    try {
        if (!flatProducersCache) {
            await rebuildCache();
        }

        // We instruct the browser not to cache it strongly, 
        // to ensure immediate updates from Admin panel are visible.
        // It's still extremely fast because the DB is bypassed via RAM cache.
        res.setHeader("Cache-Control", "no-cache");

        return res.status(200).json(
            new ApiResponse(200, "Fetched Car Producers", flatProducersCache)
        );
    } catch (error) {
        console.error("API GET FLAT PRODUCERS ERROR:", error);
        return res.status(500).json(new ApiResponse(500, null, "Failed to fetch producers"));
    }
};

// ==========================================
// PUBLIC & ADMIN: Get all structured (For Admin UI)
// ==========================================
module.exports.getAllProducers = async (req, res) => {
    try {
        const producers = await CarProducer.find().sort({ name: 1 });
        return res.status(200).json(
            new ApiResponse(200, "Fetched all producers", producers)
        );
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "Failed to fetch"));
    }
};

// ==========================================
// ADMIN: Create a Brand
// ==========================================
module.exports.createProducer = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json(new ApiResponse(400, null, "Name is required"));

        const existing = await CarProducer.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
        if (existing) return res.status(400).json(new ApiResponse(400, null, "Brand already exists"));

        const producer = await CarProducer.create({ name, models: [] });
        await rebuildCache();

        return res.status(201).json(new ApiResponse(201, "Brand created successfully", producer));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "Failed to create brand"));
    }
};

// ==========================================
// ADMIN: Add models to a Brand
// ==========================================
module.exports.updateProducerModels = async (req, res) => {
    try {
        const { id } = req.params;
        const { models } = req.body; // Expects an array of strings

        if (!Array.isArray(models)) {
            return res.status(400).json(new ApiResponse(400, null, "Models must be an array"));
        }

        const producer = await CarProducer.findByIdAndUpdate(
            id,
            { $set: { models } },
            { new: true, runValidators: true }
        );

        if (!producer) return res.status(404).json(new ApiResponse(404, null, "Brand not found"));

        await rebuildCache();

        return res.status(200).json(new ApiResponse(200, "Models updated", producer));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "Failed to update models"));
    }
};

// ==========================================
// ADMIN: Rename a Brand
// ==========================================
module.exports.renameProducer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json(new ApiResponse(400, null, "Name is required"));
        }

        // Check if the new name already exists (case-insensitive)
        const existing = await CarProducer.findOne({
            _id: { $ne: id },
            name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
        });
        if (existing) {
            return res.status(400).json(new ApiResponse(400, null, "A brand with this name already exists"));
        }

        const producer = await CarProducer.findByIdAndUpdate(
            id,
            { $set: { name: name.trim() } },
            { new: true, runValidators: true }
        );

        if (!producer) return res.status(404).json(new ApiResponse(404, null, "Brand not found"));

        await rebuildCache();

        return res.status(200).json(new ApiResponse(200, "Brand renamed successfully", producer));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "Failed to rename brand"));
    }
};

// ==========================================
// ADMIN: Delete a Brand
// ==========================================
module.exports.deleteProducer = async (req, res) => {
    try {
        const { id } = req.params;
        const producer = await CarProducer.findByIdAndDelete(id);

        if (!producer) return res.status(404).json(new ApiResponse(404, null, "Brand not found"));

        await rebuildCache();

        return res.status(200).json(new ApiResponse(200, "Brand deleted"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "Failed to delete brand"));
    }
};
