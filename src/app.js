const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");
const app = express();
const expressValidator = require("express-validator");
require("custom-env").env();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger/swagger.json");
const { connectRouters } = require("./initializer/framework");

class App {
    constructor() {
        this.appUse();
        this.routerConnection();
        this.appSecurity();
        // this.swaggerSetup();

        this.connectServer();
    }

    appUse() {
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

        app.use(express.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());
        app.use(
            cors({
                credentials: true
            })
        );
    }

    routerConnection() {
        connectRouters(app);

        app.get("/api", (req, res) => {
            res.send("Hey am from express Modular pipeline test");
        });

        console.log(
            "Environment:", process.env.APP_ENV
        );
        
    }

    appSecurity() {
        app.use(helmet());
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        });
        //  apply to all requests
        app.use(limiter);
    }

    swaggerSetup() {
        const swagger = require("swagger-generator-express");
        const options = {
            title: "swagger-generator-express",
            version: "1.0.0",
            host: "localhost:3000",
            basePath: "/",
            schemes: ["http", "https"],
            securityDefinitions: {
                Bearer: {
                    description: "Example value:- Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU5MmQwMGJhNTJjYjJjM",
                    type: "apiKey",
                    name: "Authorization",
                    in: "header"
                }
            },
            security: [{ Bearer: [] }],
            defaultSecurity: "Bearer"
        };
        swagger.serveSwagger(app, "/swagger", options, {
            routePath: "./src/swagger/route.js",
            requestModelPath: "./src/swagger/routeModal.js",
            responseModelPath: "./src/swagger/routerResponse.js"
        });
    }

    connectServer() {
        app.listen(process.env.PORT || 5000, () => {
            console.log("Hey am running on port 5000");
        });
    }
}

const mainApp = new App();