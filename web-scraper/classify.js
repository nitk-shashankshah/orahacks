var {CohereClientV2} = require("cohere-ai");
// Function to summarize text using Cohere API


const classifyData = async (summaryLs, industry='HEALTHCARE') => {
  var predictions = [];
  try{
    const cohere = new CohereClientV2({
      token: "FAkelchNnrqTDiWqN32bnBykS1wmn12wKJMAuTZi",
    });

    var model_id = "78b4cc0f-6c20-4c40-9689-14479245bfa8-ft";
    if (industry == 'SPORT')
      model_id = "78b4cc0f-6c20-4c40-9689-14479245bfa8-ft";
    else if (industry == 'TECH' || industry == 'AI' || industry == 'SEMICONDUCTORS')
      model_id = "917a6b23-48d7-4064-9610-f412ba6cec38-ft";
    else if (industry == 'HEALTHCARE')
      model_id = "e85f034f-04da-4779-b730-4084dae2e2f3-ft";

    const classify = await cohere.classify({
      model: model_id,
      inputs: summaryLs
    });
  
    //var prediction = classify.classifications[0].prediction;
    
    predictions = classify.classifications.map(each => each.prediction);
  } catch (ex) {
    console.log(ex.message);
  }
  return predictions;
}
  
module.exports = classifyData;
