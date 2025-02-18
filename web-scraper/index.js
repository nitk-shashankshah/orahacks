// Filename - index.js
var cors = require('cors');
var { railwayScraping, classifyData, db_connect }  = require('./railway'); 
var { scraper }  = require('./cnbc/cnbc'); 
var { bloomberg }  = require('./bloomberg/blommberg'); 
var { forbes }  = require('./forbes/forbes'); 

var transportScraping = require('./transport'); 

// Importing express module
const express = require("express")
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
app.get("/load/bloogberg", cors(corsOptions), async (req, res, next) => {
    var ls = await bloomberg();
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})

// Handling GET /hello request
app.get("/load/forbes", cors(corsOptions), async (req, res, next) => {
    var ls = await forbes();
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})
// Server setup
app.listen(3000, () => {
    console.log("Server is Running")
})