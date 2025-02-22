// Filename - index.js


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
var { railwayScraping, classifyData, db_connect }  = require('./railway/railway'); 
var { scraper }  = require('./cnbc/cnbc'); 
var { bloomberg }  = require('./bloomberg/blommberg'); 
var { yahoo }  = require('./yahoo/yahoo'); 
var { insider }  = require('./insider/insider'); 
var { cnn }  = require('./cnn/cnn'); 
var { marketwatch }  = require('./marketwatch/marketwatch'); 
var { wsj }  = require('./wsj/wsj'); 
var {forbes} = require("./forbes/forbes");

var transportScraping = require('./transport'); 

// Importing express module
const express = require("express");
const app = express()

// CORS is enabled for the selected origins
let corsOptions = {
    origin: [ '*' ]
};

app.use(cors());

// Handling GET /hello request
app.get("/opportunities", cors(corsOptions), async (req, res, next) => {
    var ls = await classifyData(req.query.label);
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
    var ls = await scraper();
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
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
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
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
app.listen(3000, () => {
    console.log("Server is Running")
})