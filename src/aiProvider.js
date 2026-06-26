const OpenAI = require("openai");
const { GoogleGenAI } = require("@google/genai");
const Anthropic = require("@anthropic-ai/sdk");


class AIProvider {

    constructor() {
        this.provider = process.env.AI_PROVIDER || "gemini";

        switch(this.provider) {

            case "openai":
                this.client = new OpenAI({
                    apiKey: process.env.OPENAI_API_KEY
                });
                break;


            case "gemini":
                this.client = new GoogleGenAI({
                    apiKey: process.env.GEMINI_API_KEY
                });
                break;


            case "anthropic":
                this.client = new Anthropic({
                    apiKey: process.env.ANTHROPIC_API_KEY
                });
                break;


            default:
                throw new Error(
                    `Unsupported AI provider: ${this.provider}`
                );
        }
    }



    async generate(prompt) {

        try {

            switch(this.provider) {


                case "openai":

                    const openaiResponse =
                        await this.client.chat.completions.create({

                            model:
                                process.env.AI_MODEL ||
                                "gpt-4.1-mini",

                            messages:[
                                {
                                    role:"user",
                                    content:prompt
                                }
                            ]

                        });


                    return openaiResponse
                        .choices[0]
                        .message
                        .content;



                case "gemini":

                    const geminiResponse =
                        await this.client.models.generateContent({

                            model:
                                process.env.AI_MODEL ||
                                "gemini-2.5-flash",

                            contents:prompt

                        });


                    return geminiResponse.text;



                case "anthropic":

                    const claudeResponse =
                        await this.client.messages.create({

                            model:
                                process.env.AI_MODEL ||
                                "claude-3-5-sonnet-latest",

                            max_tokens:4000,

                            messages:[
                                {
                                    role:"user",
                                    content:prompt
                                }
                            ]

                        });


                    return claudeResponse
                        .content[0]
                        .text;

            }


        } catch(error){

            throw new Error(
                `AI generation failed (${this.provider}): ${error.message}`
            );

        }

    }

}


module.exports = AIProvider;