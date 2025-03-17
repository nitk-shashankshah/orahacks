var {CohereClientV2} = require("cohere-ai");
// Function to summarize text using Cohere API

const sentimentAnalysis = async (summaryLs) => {
  var predictions = [];
  try{
    const cohere = new CohereClientV2({
      token: "FAkelchNnrqTDiWqN32bnBykS1wmn12wKJMAuTZi",
    });

    var model_id = "53664f93-b031-4d1d-a867-179addaa6d42-ft";   

    const classify = await cohere.classify({
      model: model_id,
      inputs: summaryLs
    });
      
    predictions = classify.classifications.map(each => each.prediction);
  } catch (ex) {
    console.log(ex.message);
  }
  return predictions;
}
  
module.exports = sentimentAnalysis;
