var {CohereClientV2} = require("cohere-ai");
// Function to summarize text using Cohere API
const classifyData = async (summary) => {

    const classify = await cohere.classify({
      model: "7939a9db-b48e-414c-93d6-7876d475061f-ft",
      inputs: [summary],
    });
  
    console.log(JSON.stringify(classify));
  
    return classify;
}
  
module.exports = classifyData;
