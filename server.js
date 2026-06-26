const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer storage for OpenAPI file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'openapi_uploaded.json');
    }
});
const upload = multer({ storage: storage });

// Serve static UI files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to trigger test generation via CLI
app.post('/api/generate', upload.single('swaggerFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No specification file uploaded' });
    }

    const uploadedFilePath = path.join(__dirname, 'uploads', 'openapi_uploaded.json');
    const provider = req.body.provider || 'gemini';

    // Execute CLI command directly from the server
    const cliCommand = `node bin/copilot.js generate "${uploadedFilePath}" -p ${provider}`;

    exec(cliCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`CLI Execution Error: ${error.message}`);
            return res.status(500).json({ error: stderr || error.message });
        }

        // Extract generated Postman file dynamically from exports directory
        const exportsDir = path.join(__dirname, 'postman_exports');
        fs.readdir(exportsDir, (err, files) => {
            if (err || files.length === 0) {
                return res.json({ 
                    message: 'QA pipeline executed but collection file could not be located immediately.',
                    consoleOutput: stdout 
                });
            }
            
            // Assume the most recent generated collection file
            const latestFile = files.sort().pop();
            res.json({
                downloadUrl: `/download/${latestFile}`,
                consoleOutput: stdout
            });
        });
    });
});

// Endpoint to download exported Postman collections
app.get('/download/:filename', (req, res) => {
    const file = path.join(__dirname, 'postman_exports', req.params.filename);
    if (fs.existsSync(file)) {
        res.download(file);
    } else {
        res.status(404).send('Requested collection file not found');
    }
});

app.listen(PORT, () => {
    console.log(`Web UI Server listening at http://localhost:${PORT}`);
});