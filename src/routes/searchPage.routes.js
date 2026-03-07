const express = require("express");
const router = express.Router();

const { getSearchResults, getRecentlyAddedCars, getSuggestions } = require("../controllers/searchPage.controller");

router.get("/search/suggestions", getSuggestions);
router.get("/search/recent", getRecentlyAddedCars);
router.get("/search", getSearchResults);

module.exports = router;