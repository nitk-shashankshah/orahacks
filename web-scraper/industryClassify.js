var {CohereClientV2} = require("cohere-ai");
// Function to summarize text using Cohere API


const industryClassifyData = async (summaryLs, industry='HEALTHCARE') => {
  var predictions = [];
  try{
    const cohere = new CohereClientV2({
      token: "FAkelchNnrqTDiWqN32bnBykS1wmn12wKJMAuTZi",
    });  

    const classify = await cohere.classify({     
      model: 'e5e65c81-8509-4f31-8aad-d8b6acac0256-ft',
      inputs: summaryLs
    });
  

    console.log(JSON.stringify(classify.classifications));

    predictions = classify.classifications.map(each => each.predictions.join());

    //console.log(JSON.stringify(predictions));
  
  } catch (ex) {
    console.log(ex.message);
  }
  return predictions;
}
  
module.exports = industryClassifyData;
