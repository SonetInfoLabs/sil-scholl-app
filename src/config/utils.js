const dateTime = require("node-datetime");
const Cryptr = require("cryptr");
const cryptr = new Cryptr('7b75a472b65bc4a42e7b3f7883');
const winston = require("winston");
const APPCONSTANTS = require("../../app.constants");
var randomstring = require("randomstring");


const getDateTime = () => {
    const dt = dateTime.create();
    return dt.format("Y-m-d H:M:S");
};

async function returnResult(type, object, customMsg = null) {
    if (object) {
        return customMsg != null ? { message: customMsg, result: [] } : {
            message: customMsg != null ? customMsg : "Query Success",
            result: object
        };
    } else {
        return customMsg != null ? { message: customMsg, result: [] } : {
            message: type + " does not exists",
            result: []

        };
    }
}

async function retrunResponse(res, Obj) {
    // console.log(Obj);

    let resultCode = 200;

    if (Obj.message.includes('You are not allowed to change')) {
        resultCode = "401";
    }
    if (Obj.message.includes('Duplicate entry')) {
        resultCode = "401";
        Obj.message = Obj.message.split(' for key')[0].replace(/'/g, "", );
    }
    if (Obj.message.includes('Unauthorized')) {
        resultCode = "401";
        Obj.message = Obj.message.split(' for key')[0].replace(/'/g, "", );
    }

    return res.status(resultCode).json({
        result: "OK",
        resultCode: resultCode,
        message: Obj.message,
        data: Obj.result,
        resultTotal: Obj.result.length
    });


}

const encrypt = (text) => cryptr.encrypt(text);
const decrypt = (encText) => cryptr.decrypt(encText);

async function setTokenParams(userid, accessToken, refreshToken) {
    return {
        userId: userid,
        accessToken: accessToken,
        refreshToken: refreshToken,
        status: "Active"
    };
}

//generate random string
async function generateRandomString(len) {
    return randomstring.generate(len);

}

async function checkACL(feature, functionality, userDetails) {
    console.log("functionality", functionality);
    let acl = "NA";
    if (feature !== null && functionality !== null) {
        //check whether the use has access to this feature or not

        let permi = userDetails.result.Role.Permission.permissionList;
        if (typeof permi === "string") {
            permi = permi.replace("[", '');
            permi = permi.replace("]", '');

            permi = JSON.parse(permi);
        } else {
            permi = permi[0];
        }
        console.log(permi);

        let acl = "NA";
        for (var key in permi) {
            if (key == feature) {
                acl = permi[key];
                break;
            }
        }
        console.log("ACL", acl);
        console.log(functionality);

        if (acl !== "NA") {
            if (functionality === "Create" || functionality === "Update") {
                if (acl.includes("RW")) {
                    return acl;
                }

            } else if (functionality === "Execute") {
                if (acl === "RWX") {
                    return acl;
                }
            } else if (functionality === "Read") {
                if (acl.includes("R")) {
                    console.log(3);
                    return acl;
                }
            }
        }
        return "NA";
    }
    return acl;
}

async function catchError(feature, err) {
    await logToWinston({
        "Query": JSON.parse(JSON.stringify(err.original)).sql,
        "SQLMessage": JSON.parse(JSON.stringify(err.original)).sqlMessage
    });
    return await returnResult(feature, false, JSON.parse(JSON.stringify(err.original)).sqlMessage);
}

async function logErrorMsg(feature, errMsg, notify = false) {
    if (notify) {
        await logToWinston({
            "Notification Msg": errmsg
        });
    } else {
        await logToWinston({
            "ErrorMessage": errmsg
        });
    }
    return await returnResult(feature, false, errmsg);
}

async function logToWinston(errMsg) {
    const logger = winston.createLogger({
        transports: [
            //new winston.transports.Console(),
            new winston.transports.File({ filename: 'errorLogs.log' })
        ]
    });

    logger.log({
        level: 'error',
        message: errMsg
    })
}

async function checkBaseUser(userId) {
    const user = await userModel.findByPk(userId, {
        attributes: {
            exclude: ["password", "createdAt", "updatedAt"]
        }
    });
    return user;

}

module.exports = {
    getDateTime,
    returnResult,
    retrunResponse,
    encrypt,
    decrypt,
    setTokenParams,
    generateRandomString,
    checkACL,
    catchError,
    logToWinston,
    checkBaseUser,
    logErrorMsg
};