var {CohereClientV2} = require("cohere-ai");
// Function to summarize text using Cohere API
const summarizeText = async(txt) => {

  const cohere = new CohereClientV2({
    token: "FAkelchNnrqTDiWqN32bnBykS1wmn12wKJMAuTZi",
  });

  try {
    // Make a request to the Cohere Summarize API
    const response = await cohere.summarize({
      text: txt,
      length: 'short', 
      format: 'paragraph',
    });

    // Extract the summary from the API response
    const summary = response.summary;
  
    return summary;
  } catch (error) {
    //console.error('Error summarizing text:', error);
    return null;
  }
}


const classifyData = async (summary) => {

  const classify = await cohere.classify({
    model: "7939a9db-b48e-414c-93d6-7876d475061f-ft",
    inputs: [summary],
  });

  console.log(JSON.stringify(classify));

  return classify;
}

module.exports = summarizeText;
