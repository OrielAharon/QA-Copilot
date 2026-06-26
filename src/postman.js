const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class PostmanExporter {
    constructor() {
        this.exportDir = path.join(__dirname, '../postman_exports');
    }

    /**
     * Translates parsed OpenAPI endpoints and AI test cases into a Postman Collection JSON
     * @param {Object} endpoint - The parsed endpoint object { method, path, parameters }
     * @param {Object} aiTestCases - The JSON object returned by the AI Agent
     * @returns {string} - The filename of the exported collection
     */
    generateCollection(endpoint, aiTestCases) {
        logger.info('Preparing Postman Collection structure...');
        
        // Ensure export directory exists
        if (!fs.existsSync(this.exportDir)) {
            fs.mkdirSync(this.exportDir, { recursive: true });
        }

        // Base Postman Collection 2.1 Schema
        const collection = {
            info: {
                name: `QA Copilot - ${endpoint.method.toUpperCase()} ${endpoint.path}`,
                schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
                description: "Auto-generated Postman collection by OpenAPI QA Copilot"
            },
            item: []
        };

        // Helper function to add requests to the collection folder
        const addFolderItems = (folderName, tests) => {
            if (!tests || !Array.isArray(tests) || tests.length === 0) return;

            const folder = {
                name: folderName,
                item: []
            };

            tests.forEach((test, index) => {
                // Convert path parameters from {param} to :param for Postman syntax
                let postmanPath = endpoint.path.replace(/\{([^}]+)\}/g, ':$1');
                
                // Build basic request item
                const requestItem = {
                    name: test.title || `${test.expectedResult.substring(0, 30)}...`,
                    request: {
                        method: endpoint.method.toUpperCase(),
                        header: [
                            {
                                key: "Content-Type",
                                value: "application/json"
                            }
                        ],
                        url: {
                            raw: `{{baseUrl}}${postmanPath}`,
                            host: ["{{baseUrl}}"],
                            path: postmanPath.split('/').filter(Boolean)
                        },
                        description: `Description: ${test.description || 'N/A'}\nExpected Result: ${test.expectedResult || 'N/A'}`
                    },
                    response: []
                };
                folder.item.push(requestItem);
            });

            collection.item.push(folder);
        };

        // Populate items based on AI JSON response structure
        if (aiTestCases.positive) addFolderItems('Positive Scenarios', aiTestCases.positive);
        if (aiTestCases.negative) addFolderItems('Negative Scenarios', aiTestCases.negative);
        if (aiTestCases.edgeCases) addFolderItems('Edge Cases', aiTestCases.edgeCases);
        if (aiTestCases.securityTests) addFolderItems('Security Tests', aiTestCases.securityTests);

        // Create a safe timestamped filename
        const safePathName = endpoint.path.replace(/[/\\?%*:|"<>]/g, '_');
        const filename = `${endpoint.method.toUpperCase()}${safePathName}_collection.json`;
        const outputPath = path.join(this.exportDir, filename);

        // Write collection to physical JSON file
        fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), 'utf-8');
        logger.info(`Postman Collection successfully exported to: ${outputPath}`);

        return outputPath;
    }
}

module.exports = PostmanExporter;