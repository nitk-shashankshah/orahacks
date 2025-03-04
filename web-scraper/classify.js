var {CohereClientV2} = require("cohere-ai");
// Function to summarize text using Cohere API


const classifyData = async (summary) => {
  var prediction = 'Spam';
  try{
    const cohere = new CohereClientV2({
      token: "FAkelchNnrqTDiWqN32bnBykS1wmn12wKJMAuTZi",
    });

    console.log(".....inside here.....");

    console.log(JSON.stringify(summary));

    const classify = await cohere.classify({
      model: "917a6b23-48d7-4064-9610-f412ba6cec38-ft",
      inputs: [summary],
    });
  
    var prediction = classify.classifications[0].prediction;
    
    console.log("prediction :" + JSON.stringify(prediction));
  } catch (ex) {
    console.log(ex.message);
  }
  return prediction;
}
  
module.exports = classifyData;
