const express = require("express");
const router = express.Router();

const { getSearchResults } = require("../controllers/searchPage.controller");


router.get("/search", getSearchResults);
module.exports = router;