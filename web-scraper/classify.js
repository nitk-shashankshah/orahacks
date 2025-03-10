var {CohereClientV2} = require("cohere-ai");
// Function to summarize text using Cohere API


const classifyData = async (summaryLs) => {
  var predictions = [];
  try{
    const cohere = new CohereClientV2({
      token: "FAkelchNnrqTDiWqN32bnBykS1wmn12wKJMAuTZi",
    });
  
    const classify = await cohere.classify({
      //model: "917a6b23-48d7-4064-9610-f412ba6cec38-ft",
      //model: "e85f034f-04da-4779-b730-4084dae2e2f3-ft",
      model: "78b4cc0f-6c20-4c40-9689-14479245bfa8-ft",
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
