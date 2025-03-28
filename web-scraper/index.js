// to increase the header size 
if (!process.execArgv.some(arg => arg.startsWith("--max-http-header-size="))) {
    const { spawn } = require("child_process");
    const args = process.argv.slice(1);
    args.unshift("--max-http-header-size=32768");
    const child = spawn(process.execPath, args, {
      stdio: "inherit",
      env: process.env
    });
    child.on("exit", (code) => {
      process.exit(code);
    });
    return;
  }

var cors = require('cors');
var { sports_classification, railwayScraping, classifyData, getSearchClassifiedData, getClassifiedData, createTraining, embedData , getSentiment}  = require('./railway/railway'); 
var { cnbc_scraper, cnbc_get_content, cnbc_classification, cnbc_industry_classification, cnbc_sentiment_analysis }  = require('./cnbc/cnbc'); 
var { cnn, cnn_classification, cnn_industry_classification,cnn_sentiment_analysis }  = require('./cnn/cnn'); 

var { reuters_scraper, reuters_industry_classification, reuters_get_content, reuters_classification, reuters_sentiment_analysis  }  = require('./reuters/reuters'); 


const clientRoutes = require("./src/routes/clientRoutes");
const industryRoutes = require("./src/routes/industryRoutes");
const widgetsRoutes = require("./src/routes/widgetsRoutes");
const clientParamsRoutes = require("./src/routes/clientParamsRoutes");
const fs = require("fs");
const path = require("path");
var {CohereClient} = require("cohere-ai");

const filePath = path.resolve("response.json");

// Load the JSON response from a local file
const response = JSON.parse(fs.readFileSync(filePath, "utf-8"));

const cohere = new CohereClient({
    token: "FAkelchNnrqTDiWqN32bnBykS1wmn12wKJMAuTZi",
  });

var transportScraping = require('./transport'); 

const express = require("express");
const app = express()

let corsOptions = {
    origin: [ '*' ]
};

app.use(cors());

app.use(express.json()); 

app.use("/api/clients", clientRoutes);
app.use("/api/industry", industryRoutes); 
app.use("/api/allwidgets", widgetsRoutes); 
app.use("/api/client-params", clientParamsRoutes);

app.get("/training", cors(corsOptions), async (req, res, next) => {
    var ls = await createTraining();
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})

app.get("/embed", cors(corsOptions), async (req, res, next) => {
    var ls = await embedData();
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})

// Handling GET /hello request
app.get("/sentiment", cors(corsOptions), async (req, res, next) => {
    var ls = await getSentiment(req.query.type, req.query.industry);
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})

// Handling GET /hello request
app.get("/classify", cors(corsOptions), async (req, res, next) => {
    var ls;
    if (req.query.classification && req.query.classification.toUpperCase() == 'OPPORTUNITY')
        ls = await classifyData(req.query.label, req.query.classification);
    else if  (req.query.search)
        ls = await getSearchClassifiedData(req.query.search);
    else if  (req.query.classification)
        ls = await getClassifiedData(req.query.label, req.query.classification);
    res.send(JSON.stringify(ls));
})

// Handling GET /hello request
app.get("/load/railway", cors(corsOptions), async (req, res, next) => {
    var ls = await railwayScraping();
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})

// Handling GET /hello request
app.get("/load/cnbc", cors(corsOptions), async (req, res, next) => {
    /*try{
    var ls = await cnbc_scraper();
    } catch(ex){

    }
    ls = await cnbc_industry_classification();*/
    //ls = await cnbc_get_content();
    await cnbc_classification();
    //var sentiment = await cnbc_sentiment_analysis()
    res.send(JSON.stringify({}));
})

// Handling GET /hello request
app.get("/load/cnn", cors(corsOptions), async (req, res, next) => {
    var cls = await cnn();
    cls = await cnn_industry_classification();
    //var ls = await cnbc_get_content();
    cls = await cnn_classification();
    cls = await cnn_sentiment_analysis();
    res.send(JSON.stringify(cls));
})

// Handling GET /hello request
app.get("/load/reuters", cors(corsOptions), async (req, res, next) => {
    //var ls = await reuters_scraper();
    let ls = await reuters_industry_classification();
    //let ls = await reuters_get_content();
    ls = await reuters_classification();
    ls = await reuters_sentiment_analysis();
    //console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})




// Function to extract product details
const extractProductDetails = (data) => {
    console.log(data);
    const products = data.immersive_products || [];

    return products.map((product, index) => ({
        id: index + 1,
        brand: product.source || "Unknown",
        title: product.title || "No Title",
        price: product.price || "N/A",
        currency: product.extracted_price ? "$" : "N/A",
        rating: product.rating || "No Rating",
        reviews: product.reviews || "No Reviews",
        seller: product.source || "Unknown Seller",
        //link: product.link || "No Link",
        //thumbnail: product.thumbnail || "No Image"
    }));
};

// API route
app.get("/sports/tshirts", async (req, res) => {
    const products = extractProductDetails(response);   

    let chat = await cohere.chat({
        model: "command",
        message: "I am a sprots company and making tshirts I am sharing some sports company data with you please provide me some insights about it, data - " + JSON.stringify(products),
    });

    console.log(chat);
    let messageArray = chat.text.split('\n\n'); 
    messageArray.shift(); 
    chat = messageArray.join('\n\n');

    res.json({ products, oppurtinuty: chat });
});

// Server setup
app.listen(3001, () => {
    console.log("Server is Running")
})