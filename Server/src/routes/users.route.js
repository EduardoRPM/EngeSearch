const { Router } = require("express");
const { getProfile } = require("../controllers/users.controller");
const { verifyJWT } = require("../../middlewares/verifyJWT");

const router = Router();

router.get("/me", [verifyJWT], getProfile);

module.exports = router;
