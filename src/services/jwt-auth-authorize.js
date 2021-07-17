const jwt = require("jsonwebtoken");
const utils = require("../config/utils");
const users = require("../modules/users/User");
const userService = require("../modules/users/services/service");
const md5 = require("md5");
const tokenService = require("../modules/tokens/services/service");
const VTCService = require("../modules/vendorTenantChannels/services/service");
const APPCONS = require("../../app.constants");

const expiresIn = "10m";
const jwtAuthenticate = () => {
    return async(req, res, next) => {
        console.log(req.body.userName);

        ///check whether the user exists or not
        let user = await userService.getUserBy(req.body);

        if (user.message !== "Query Success") {
            return res.status(422).json(APPCONS.INVALIDUSERCREDENTIALS);
        } else {
            if (md5(req.body.password) !== user.result.password) {
                return res.status(422).json(APPCONS.INVALIDUSERCREDENTIALS);
            } else {
                //generate token
                const [accessToken, refreshToken] = await Promise.all([
                    generateToken(user, "accessToken"),
                    generateToken(user, "refreshToken")
                ]);

                const tokenParams = await utils.setTokenParams(
                    user.result.userId,
                    accessToken,
                    refreshToken
                );

                delete user.result.password;
                res.json({
                    loginSuccess: true,
                    user: user.result,
                    accessToken,
                    refreshToken
                });
                req.user = user.result;
                next();
            }
        }
    };
};

async function generateToken(user, type) {
    if (type === "accessToken") {
        // console.log("Hey", user);
        if (user.result) {
            return jwt.sign({
                    user: user.result.userName,
                    email: user.result.email,
                    userId: user.result.userId
                },
                //process.env.ACCESS_TOKEN_SECRET, { expiresIn }
                APPCONS.ACCESS_TOKEN_SECRET, { expiresIn }
            );
        } else {
            // console.log("HEY", user);
            return jwt.sign({ user: user.userName, email: user.email, userId: user.userId },
                APPCONS.ACCESS_TOKEN_SECRET, { expiresIn }
            );
        }
    } else {
        if (user.result) {
            return jwt.sign({
                    user: user.result.userName,
                    email: user.result.email,
                    userId: user.result.userId
                },
                APPCONS.REFRESH_TOKEN_SECRET
            );
        } else {
            return jwt.sign({ user: user.userName, email: user.email, userId: user.id },
                APPCONS.REFRESH_TOKEN_SECRET
            );
        }
    }
}

const jwtAuthorise = (feature = null, functionality = null) => {
    return async(req, res, next) => {
        const refreshToken = req.headers["refreshtoken"];
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json(APPCONS.ACCESSTOKENREQUIRED);
        }

        jwt.verify(token, APPCONS.ACCESS_TOKEN_SECRET, async(err, user) => {
            if (err) {
                jwt.verify(
                    refreshToken,
                    APPCONS.REFRESH_TOKEN_SECRET,
                    async(err, user) => {
                        if (!user) {
                            return res.status(403).json(APPCONS.INVALIDACCESSTOKEN);
                        }
                        jwt.verify(
                            refreshToken,
                            APPCONS.REFRESH_TOKEN_SECRET,
                            async(err, user) => {
                                const accessToken = await generateToken(user, "accessToken");
                                const tokenParams = await utils.setTokenParams(
                                    user.userId,
                                    accessToken,
                                    refreshToken
                                );

                                await tokenService.createToken(tokenParams);
                                req.user = user;

                                if (feature !== null && functionality !== null) {
                                    let userDetails = await userService.getUserByPK(
                                        user.userId
                                    );
                                    let acl = await utils.checkACL(
                                        feature,
                                        functionality,
                                        userDetails
                                    );

                                    if (checkACL(acl, req.body)) {
                                        console.log("hey:" + acl);
                                        return res.status(401).json(APPCONS.NOTALLOWEDSTATUSUPDATE);
                                    }

                                    if (acl === "NA") {
                                        return res.status(403).json(APPCONS.ACCESSDENIED);
                                    }

                                    //check if feature is Users functionality is update

                                    if (feature == "Users" && functionality == "Update") {
                                        //check whether update is performing on same loggedin user or to the same vendor users.
                                        console.log("hey" + req.params.id + ":" + user.userId);

                                        if (req.params.id != user.userId) {
                                            console.log('ssd')
                                            let userDet = await userService.getUserByPK(
                                                req.params.id
                                            );

                                            let allowedOrNotResp = await checkUserVendor(userDet, userDetails, res);
                                            if (allowedOrNotResp != 'allowed') {
                                                return res.status(403).json(allowedOrNotResp);
                                            }

                                        }
                                    }

                                }
                                next();
                            }
                        );
                    }
                );
            } else {
                req.user = user;
                let userDetails = await userService.getUserByPK(user.userId);
                if (feature != null && functionality != null) {
                    let acl = await utils.checkACL(feature, functionality, userDetails);
                    console.log("ACL ISS: " + acl);

                    if (checkACL(acl, req.body)) {
                        return res.status(401).json(APPCONS.NOTALLOWEDSTATUSUPDATE);
                    }
                    if (acl == "NA") {
                        return res.status(403).json(APPCONS.ACCESSDENIED);
                    }
                }

                //check if feature is Users functionality is update

                if (feature == "Users" && functionality == "Update") {
                    //check whether update is performing on same loggedin user or to the same vendor users.
                    console.log(req.params.id + ":" + user.userId);

                    if (req.params.id != user.userId) {
                        let userDet = await userService.getUserByPK(
                            req.params.id
                        );

                        let allowedOrNotResp = await checkUserVendor(userDet, userDetails, res);
                        if (allowedOrNotResp != 'allowed') {
                            return res.status(403).json(allowedOrNotResp);
                        }
                    }
                }
                next();
            }
        });
    };
};

function checkACL(acl, reqBody) {
    let returnVal = false;
    //check whether any status update
    switch (acl) {
        case "RW":
            if (reqBody.status) {
                returnVal = true;
            }
            break;
        case "W":
            if (reqBody.status) {
                returnVal = true;
            }
            break;
        case "R":
            if (reqBody.status) {
                returnVal = true;
            }
            break;
    }
    return returnVal;
}

async function checkUserVendor(userDet, userDetails, res) {

    let resp = "allowed";
    const cond = (userDet.result.vendorId == userDetails.result.vendorId) && (userDetails.result.Role.id > 0 && userDetails.result.Role.id < 3);
    if (!cond) {
        resp = APPCONS.NOTALLOWEDUPDATE;
    }

    if (resp != '') {
        return resp;
    }

}

module.exports = {
    jwtAuthenticate,
    jwtAuthorise
};