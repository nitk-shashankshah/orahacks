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
var { railwayScraping, classifyData, createTraining, db_connect }  = require('./railway/railway'); 
var { cnbc_scraper, cnbc_classification, cnbc_industry_classification }  = require('./cnbc/cnbc'); 
var { cnn, cnn_classification, cnn_industry_classification }  = require('./cnn/cnn'); 

var { bloomberg }  = require('./bloomberg/blommberg'); 
var { yahoo }  = require('./yahoo/yahoo'); 
var { insider }  = require('./insider/insider'); 
var { marketwatch }  = require('./marketwatch/marketwatch'); 
var { wsj }  = require('./wsj/wsj'); 
var {forbes} = require("./forbes/forbes");

const clientRoutes = require("./src/routes/clientRoutes");
const industryRoutes = require("./src/routes/industryRoutes");
const widgetsRoutes = require("./src/routes/widgetsRoutes");
const clientParamsRoutes = require("./src/routes/clientParamsRoutes");

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

// Handling GET /hello request
app.get("/classify", cors(corsOptions), async (req, res, next) => {
    var ls = await classifyData(req.query.label, req.query.classification);
    console.log(JSON.stringify(ls));
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
    //var ls = await cnbc_scraper();
    var cls = await cnbc_classification();
    //var cls = await cnbc_industry_classification();
    res.send(JSON.stringify({}));
})

// Handling GET /hello request
app.get("/load/forbes", cors(corsOptions), async (req, res, next) => {
    var ls = await forbes();
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})

// Handling GET /hello request
app.get("/load/bloogberg", cors(corsOptions), async (req, res, next) => {
    var ls = await bloomberg();
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})

// Handling GET /hello request
app.get("/load/yahoo", cors(corsOptions), async (req, res, next) => {
    var ls = await yahoo();
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})

// Handling GET /hello request
app.get("/load/insider", cors(corsOptions), async (req, res, next) => {
    var ls = await insider();
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})

// Handling GET /hello request
app.get("/load/cnn", cors(corsOptions), async (req, res, next) => {
    var ls = await cnn();
    var cls = {};
    //var cls = await cnn_industry_classification();
    //var cls = await cnn_classification();
    res.send(JSON.stringify(cls));
})


// Handling GET /hello request
app.get("/load/marketwatch", cors(corsOptions), async (req, res, next) => {
    var ls = await marketwatch();
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})

// Handling GET /hello request
app.get("/load/wsj", cors(corsOptions), async (req, res, next) => {
    var ls = await wsj();
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})
// Server setup
app.listen(3001, () => {
    console.log("Server is Running")
})
