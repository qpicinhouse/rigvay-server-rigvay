const express = require("express");
const router = express.Router();

const { getSearchResults, getRecentlyAddedCars} = require("../controllers/searchPage.controller");


router.get("/search", getSearchResults);
router.get("/search/recent", getRecentlyAddedCars);

module.exports = router;