var {CohereClientV2} = require("cohere-ai");

const compareData = async (inputLs) => {
  var predictions = [];
  try{
    const cohere = new CohereClientV2({
      token: "FAkelchNnrqTDiWqN32bnBykS1wmn12wKJMAuTZi",
    });
    
    const res = await cohere.embed({
      texts: inputLs,
      model: 'embed-english-v3.0',
      inputType: 'classification',
      embeddingTypes: ['float'],
    });
    //var prediction = classify.classifications[0].prediction;
  
    predictions = res.embeddings.float;

  } catch (ex) {
    console.log(ex.message);
  }
  return predictions;
}
  

module.exports = compareData;
