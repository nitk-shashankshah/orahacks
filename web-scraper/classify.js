var {CohereClientV2} = require("cohere-ai");
// Function to summarize text using Cohere API


const classifyData = async (summaryLs) => {
  var predictions = [];
  try{
    const cohere = new CohereClientV2({
      token: "FAkelchNnrqTDiWqN32bnBykS1wmn12wKJMAuTZi",
    });
  
    const classify = await cohere.classify({
      model: "917a6b23-48d7-4064-9610-f412ba6cec38-ft",
      inputs: summaryLs,
    });
  
    //var prediction = classify.classifications[0].prediction;
    
    predictions = classify.classifications.map(each => each.prediction);
  } catch (ex) {
    console.log(ex.message);
  }
  return predictions;
}
  
module.exports = classifyData;
