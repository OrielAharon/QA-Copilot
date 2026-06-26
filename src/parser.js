const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class OpenAPIParser {
    constructor(filePath) {
        if (!filePath) {
            throw new Error("A file path must be provided");
        }

        this.filePath = path.resolve(filePath);
        this.rawData = this._loadFile();
    }

    _loadFile() {
        if (!fs.existsSync(this.filePath)) {
            throw new Error(`File not found at path: ${this.filePath}`);
        }

        const ext = path.extname(this.filePath).toLowerCase();
        const fileContent = fs.readFileSync(this.filePath, 'utf8');

        try {
            if (ext === '.json') {
                return JSON.parse(fileContent);
            }

            if (ext === '.yaml' || ext === '.yml') {
                return yaml.load(fileContent);
            }

            throw new Error(
                "Unsupported file format. Please use JSON or YAML only."
            );

        } catch (err) {
            throw new Error(`Error reading file: ${err.message}`);
        }
    }

    extractEndpoints() {
        const endpointsList = [];

        const paths = this.rawData?.paths || {};

        const validMethods = new Set([
            'get',
            'post',
            'put',
            'delete',
            'patch',
            'options',
            'head'
        ]);

        for (const [apiPath, methods] of Object.entries(paths)) {

            if (!methods || typeof methods !== 'object') {
                continue;
            }

            for (const [method, details] of Object.entries(methods)) {

                if (!validMethods.has(method.toLowerCase())) {
                    continue;
                }

                const endpoint = details || {};

                endpointsList.push({
                    path: apiPath,
                    method: method.toUpperCase(),
                    summary: endpoint.summary ?? "No summary provided",
                    description: endpoint.description ?? "No description provided",
                    parameters: endpoint.parameters ?? []
                });
            }
        }

        return endpointsList;
    }
}

if (require.main === module) {
    const testFile = path.join(__dirname, "swagger_sample.json");

    try {
        fs.writeFileSync(
            testFile,
            JSON.stringify(
                {
                    openapi: "3.0.0",
                    paths: {
                        "/api/v1/users": {
                            get: {
                                summary: "Get all users"
                            },
                            post: {
                                summary: "Create a new user"
                            }
                        },
                        "/api/v1/users/{id}": {
                            delete: {
                                summary: "Delete user by ID"
                            }
                        }
                    }
                },
                null,
                2
            )
        );

        const parser = new OpenAPIParser(testFile);

        const endpoints = parser.extractEndpoints();

        console.log(`\n Found ${endpoints.length} endpoints:\n`);

        endpoints.forEach(endpoint => {
            console.log(
                `[${endpoint.method}] ${endpoint.path} - ${endpoint.summary}`
            );
        });

        fs.unlinkSync(testFile);

    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

module.exports = OpenAPIParser;