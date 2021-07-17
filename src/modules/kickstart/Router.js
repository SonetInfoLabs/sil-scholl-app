const express = require("express");
const router = express.Router();
const Utils = require("../../config/utils");

router.get("/",async(req, res, next) => {
    var resultSet = {
        "message": "Success",
        "result":{"value":"Welcome to Sonet-Node-App-KickStart"}
    }
    await Utils.retrunResponse(res, resultSet);
});

module.exports = router;