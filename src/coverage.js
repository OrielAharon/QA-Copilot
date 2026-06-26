const logger = require('./logger');

class QACoverageEngine {
    constructor() {}

    /**
     * Calculates the API coverage by comparing swagger endpoints against generated test collections
     * @param {Array} allSwaggerEndpoints - Array of all endpoints extracted from OpenAPI
     * @param {Array} testedEndpoints - Array of endpoints that have generated tests
     * @returns {Object} Coverage report metrics
     */
    calculateCoverage(allSwaggerEndpoints, testedEndpoints) {
        logger.info('Calculating API testing coverage metrics...');

        if (!allSwaggerEndpoints || allSwaggerEndpoints.length === 0) {
            logger.warn('Empty specification list provided to Coverage Engine.');
            return { coveragePercentage: 0, missingEndpoints: [] };
        }

        // Create a unique identifier set for tested endpoints "METHOD_PATH"
        const testedSet = new Set(
            testedEndpoints.map(ep => `${ep.method.toUpperCase()}_${ep.path}`)
        );

        const missingEndpoints = [];

        allSwaggerEndpoints.forEach(endpoint => {
            const id = `${endpoint.method.toUpperCase()}_${endpoint.path}`;
            if (!testedSet.has(id)) {
                missingEndpoints.push({
                    path: endpoint.path,
                    method: endpoint.method,
                    summary: endpoint.summary
                });
            }
        });

        const totalEndpoints = allSwaggerEndpoints.length;
        const coveredEndpoints = totalEndpoints - missingEndpoints.length;
        
        // Calculate coverage percentage rounded to two decimal places
        const coveragePercentage = totalEndpoints > 0 
            ? parseFloat(((coveredEndpoints / totalEndpoints) * 100).toFixed(2)) 
            : 0;

        logger.info(`API Coverage calculated: ${coveragePercentage}%`);

        return {
            totalEndpoints,
            coveredEndpoints,
            coveragePercentage,
            missingEndpoints
        };
    }
}

module.exports = QACoverageEngine;