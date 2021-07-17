const express = require("express");
const _ = require("lodash");
const modules = require("./appModules");
const { method } = require("lodash");
const Joi = require("joi");

const validatorMiddleware = (validationMethod) => (req, res, next) => {
    if (_.isNull(validationMethod)) {
        console.log("The validationRules is null");
        next();
    } else {
        const result = Joi.validate(req.body, validationMethod);
        //console.log('Req Body: ', req.body);
        result.error === null ?
            next() :
            res.status(422).json({ errors: result.error });
        console.log(result.error);
    }
};

const joiMiddleware = (schema, property) => {
    return (req, res, next) => {
        const { error } = Joi.validate(req.body, schema);
        const valid = error == null;

        if (valid) {
            next();
        } else {
            const { details } = error;
            const message = details.map((i) => i.message).join(",");

            console.log("error", message);
            res.status(422).json({ error: message });
        }
    };
};

const connectRouters = (app) => {
    modules.modules.forEach((element) => {
        const currentElement = element.toLowerCase();
        console.log(currentElement);
        app.use(
            "/api/" + currentElement,
            require("../modules/" + currentElement + "/Router")
        );
    });
};

module.exports = {
    connectRouters,
    express,
    validatorMiddleware,
    joiMiddleware
};