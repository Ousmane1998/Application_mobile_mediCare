// swagger.js
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Public Service Assistant API",
      version: "1.0.0",
      description: "API documentation for the Public Service Assistant project (using RAG)",
    },
    servers: [
      {
        url: "http://localhost:5000", // adapte selon ton port
        description: "Local server",
      },
    ],
  },
  apis: ["./routes/*.js"], // chemin vers tes routes Express
};

const swaggerSpec = swaggerJSDoc(options);

function swaggerDocs(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("✅ Swagger Docs available at: http://localhost:5000/api-docs");
}

module.exports = swaggerDocs;
