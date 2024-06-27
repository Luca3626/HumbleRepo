'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const { generateSwagger } = require('./swaggerGenerator');
const app = express();
const port = process.env.PORT || 1337;

app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// Handle API request to generate Swagger documentation
app.post('/api/swagger', (req, res) => {
    const { urlArray, endpointsConfig, serverUrl } = req.body;

    try {
        const swaggerDoc = generateSwagger(urlArray, endpointsConfig, serverUrl);
        res.json(swaggerDoc);
    } catch (error) {
        console.error("Error generating Swagger document:", error);
        res.status(500).json({ error: "Failed to generate Swagger document" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
