#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const logger = require('../src/logger');
const OpenAPIParser = require('../src/parser');
const APITestGenerator = require('../src/APITestGenerator');

const program = new Command();

program
    .name('qa-copilot')
    .description('Professional OpenAPI QA Copilot CLI for test automation & analysis')
    .version('1.0.0');

program
    .command('generate')
    .description('Generate automated test cases from an OpenAPI/Swagger specification file')
    .argument('<file>', 'Path to the OpenAPI/Swagger file (JSON or YAML)')
    .option('-p, --provider <name>', 'AI Provider (openai, gemini, anthropic)', 'gemini')
    .action(async (file, options) => {
        try {
            logger.info(`Starting QA Copilot execution using provider: ${options.provider}`);
            process.env.AI_PROVIDER = options.provider;

            const filePath = path.resolve(file);
            logger.info(`Loading specification file: ${filePath}`);

            if (!fs.existsSync(filePath)) {
                throw new Error(`Specification file not found at: ${filePath}`);
            }

            const parser = new OpenAPIParser(filePath);
            const endpoints = parser.extractEndpoints();
            
            logger.info(`Successfully parsed ${endpoints.length} endpoints from specification.`);

            if (endpoints.length === 0) {
                logger.warn('No endpoints found to analyze. Exiting.');
                return;
            }

            // Processing the first endpoint as demonstration with infinite loop prevention
            const endpointToAnalyze = endpoints[0];
            logger.info(`Analyzing target endpoint: [${endpointToAnalyze.method}] ${endpointToAnalyze.path}`);

            const maxIterations = 3;
            let iterations = 0;
            let testCasesGenerated = null;

            const generator = new APITestGenerator();

            logger.info('Connecting to AI agent...');
            while (iterations < maxIterations && !testCasesGenerated) {
                iterations++;
                logger.info(`Agent execution attempt ${iterations}/${maxIterations}`);
                
                try {
                    testCasesGenerated = await generator.generateTestsForEndpoint(endpointToAnalyze);
                    logger.info('AI agent successfully returned test cases.');
                } catch (aiError) {
                    logger.error(`AI Agent iteration ${iterations} failed: ${aiError.message}`);
                    if (iterations >= maxIterations) {
                        throw new Error('Agent reached maximum iteration limit without success. Potential infinite loop or API failure.');
                    }
                }
            }

            logger.info('=== GENERATED TEST SUITE (JSON) ===');
            console.log(testCasesGenerated);
            logger.info('===================================');

            logger.info('Verifying JSON structure integrity...');
            JSON.parse(testCasesGenerated);
            logger.info('JSON structure is perfectly valid. Task completed successfully.');

        } catch (error) {
            logger.error(`Execution failed: ${error.message}`);
            process.exit(1);
        }
    });

program.parse(process.argv);