const { Router } = require("express");
const router = Router();


router.get("/", (req, res) => {

    res.status(200).json({
        msg: "GET Users",
        result: []
    });
})

router.post("/", (req, res) => {

    res.status(200).json({
        msg: "POST Users",
        result: []
    });
})

router.delete("/", (req, res) => {

    res.status(200).json({
        msg: "DELETE Users",
        result: []
    });
})

router.put("/", (req, res) => {

    res.status(200).json({
        msg: "PUT Users",
        result: []
    });
})

module.exports = router;
