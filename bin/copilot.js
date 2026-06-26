#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const logger = require('../src/logger');
const OpenAPIParser = require('../src/parser');
const APITestGenerator = require('../src/APITestGenerator');
const PostmanExporter = require('../src/postman');
const QACoverageEngine = require('../src/coverage');

const program = new Command();

program
    .name('qa-copilot')
    .description('Professional OpenAPI QA Copilot CLI for test automation & analysis')
    .version('1.0.0');

program
    .command('generate')
    .description('Generate automated test cases and Postman collections from an OpenAPI specification file')
    .argument('<file>', 'Path to the OpenAPI/Swagger file (JSON or YAML)')
    .option('-p, --provider <name>', 'AI Provider (openai, gemini, anthropic)', 'gemini')
    .action(async (file, options) => {
        let endpoints = [];
        let endpointToAnalyze = null;
        let aiParsedJson = null;

        try {
            logger.info(`Starting QA Copilot execution using provider: ${options.provider}`);
            process.env.AI_PROVIDER = options.provider;

            const filePath = path.resolve(file);
            logger.info(`Loading specification file: ${filePath}`);

            if (!fs.existsSync(filePath)) {
                throw new Error(`Specification file not found at: ${filePath}`);
            }

            const parser = new OpenAPIParser(filePath);
            endpoints = parser.extractEndpoints();
            
            logger.info(`Successfully parsed ${endpoints.length} endpoints from specification.`);

            if (endpoints.length === 0) {
                logger.warn('No endpoints found to analyze. Exiting.');
                return;
            }

            endpointToAnalyze = endpoints[0];
            logger.info(`Analyzing target endpoint: [${endpointToAnalyze.method}] ${endpointToAnalyze.path}`);

            const maxIterations = 3;
            let iterations = 0;
            let testCasesGeneratedStr = null;

            const generator = new APITestGenerator();

            logger.info('Connecting to AI agent...');
            while (iterations < maxIterations && !testCasesGeneratedStr) {
                iterations++;
                logger.info(`Agent execution attempt ${iterations}/${maxIterations}`);
                
                try {
                    testCasesGeneratedStr = await generator.generateTestsForEndpoint(endpointToAnalyze);
                    logger.info('AI agent successfully returned test cases.');
                } catch (aiError) {
                    logger.error(`AI Agent iteration ${iterations} failed: ${aiError.message}`);
                    if (iterations >= maxIterations) {
                        throw new Error('Agent reached maximum iteration limit without success. Potential infinite loop or API failure.');
                    }
                }
            }

            logger.info('=== GENERATED TEST SUITE (JSON) ===');
            console.log(testCasesGeneratedStr);
            logger.info('===================================');

            logger.info('Verifying JSON structure integrity...');
            aiParsedJson = JSON.parse(testCasesGeneratedStr);
            logger.info('JSON structure is perfectly valid.');

        } catch (error) {
            logger.error(`Execution failed during preparation: ${error.message}`);
            process.exit(1);
        }

        try {
            // Generate Postman Collection
            logger.info("Generating Postman collection...");

            if (!aiParsedJson) {
                throw new Error("AI generated response is empty");
            }

            const postman = new PostmanExporter();

            const exportedFilePath =
                await postman.generateCollection(
                    endpointToAnalyze,
                    aiParsedJson
                );

            logger.info(
                `Postman collection created: ${exportedFilePath}`
            );

            // Calculate QA Coverage
            logger.info("Calculating API coverage...");

            const coverageEngine = new QACoverageEngine();

            const coverageReport =
                coverageEngine.calculateCoverage(
                    endpoints,
                    [endpointToAnalyze]
                );

            if (!coverageReport) {
                throw new Error(
                    "Coverage engine returned empty report"
                );
            }

            logger.info("=== QA Coverage Report ===");

            logger.info(
                `Coverage: ${coverageReport.coveragePercentage}%`
            );

            logger.info(
                `Total Endpoints: ${coverageReport.totalEndpoints}`
            );

            logger.info(
                `Covered Endpoints: ${coverageReport.coveredEndpoints}`
            );

            logger.info(
                `Missing Endpoints: ${coverageReport.missingEndpoints.length}`
            );

            logger.info("==========================");

            console.log("\nQA Generation Completed");
            console.log(
                `Postman Collection: ${exportedFilePath}`
            );
            console.log(
                `Coverage: ${coverageReport.coveragePercentage}%`
            );

        } catch (error) {
            logger.error(
                `QA generation failed: ${error.message}`
            );

            console.error(
                "\nTask failed:",
                error.message
            );

            process.exitCode = 1;
        }
    });

program.parse(process.argv);