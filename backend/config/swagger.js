// @ts-nocheck
// config/swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Public Service Assistant API",
      version: "1.0.0",
      description: "API documentation for the Public Service Assistant project (using RAG)",
    },
    servers: [
      { url: "http://localhost:5000", description: "Local server" },
    ],
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    },
  },
  apis: [path.resolve("./routes/*.js")], // chemin absolu
};

const swaggerSpec = swaggerJSDoc(options);

export function swaggerDocs(app) {
  // Serve Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("✅ Swagger Docs available at: http://localhost:5000/api-docs");

  // Serve raw JSON
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
  console.log("✅ Swagger JSON available at: http://localhost:5000/api-docs.json");

  // Write swagger.json file to the project runtime directory (typically backend/)
  try {
    const outputPath = path.resolve(process.cwd(), "swagger.json");
    fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), "utf-8");
    console.log(`💾 Swagger JSON written to: ${outputPath}`);
  } catch (err) {
    console.error("Failed to write swagger.json:", err);
  }
}
