# 🤖 OpenAPI QA Copilot

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/licenses/MIT)

AI-powered CLI tool that analyzes OpenAPI/Swagger specifications and generates structured QA test scenarios using multiple AI providers.

## ✨ Features

- 🔍 **OpenAPI Analysis**  
  Parses JSON/YAML API specifications and extracts endpoints, methods, parameters, and metadata.

- 🧠 **Multi-Model AI Support**  
  Supports:
  - Google Gemini
  - OpenAI GPT
  - Anthropic Claude

- 🧪 **Automated Test Generation**  
  Generates:
  - Positive scenarios
  - Negative scenarios
  - Edge cases
  - Security validations

- 📦 **CI/CD Ready Output**  
  Produces structured JSON test suites for automation pipelines.

- 📝 **Production Logging**  
  Built-in logging with error tracking and execution history.

---

## 🏗️ Architecture

```text
QA-Copilot/

├── bin/
│   └── copilot.js              # CLI entry point
│
├── src/
│   ├── aiProvider.js           # AI provider abstraction
│   ├── APITestGenerator.js     # Test generation engine
│   ├── parser.js               # OpenAPI parser
│   └── logger.js               # Logging service
│
├── logs/                       # Application logs
└── swagger.json                # API specification"# QA-Copilot" 
