const AIProvider = require("./aiProvider");


class APITestGenerator {


    constructor(){

        this.ai = new AIProvider();

    }



    async generateTestsForEndpoint(endpoint){


        const prompt = `

You are a senior QA engineer.

Analyze this API endpoint and create detailed test cases.

Endpoint:

Method:
${endpoint.method}

Path:
${endpoint.path}

Summary:
${endpoint.summary}

Parameters:
${JSON.stringify(endpoint.parameters,null,2)}



Return ONLY valid JSON:

{
 "positive":[
   {
     "title":"",
     "description":"",
     "expectedResult":""
   }
 ],

 "negative":[],

 "edgeCases":[],

 "securityTests":[]

}

`;


        return await this.ai.generate(prompt);

    }


}


module.exports = APITestGenerator;