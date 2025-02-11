// Filename - index.js
var cors = require('cors');
var { railwayScraping, classifyData, db_connect }  = require('./railway'); 
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
    var ls = await classifyData();
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})


// Handling GET /hello request
app.get("/load", cors(corsOptions), async (req, res, next) => {
    var ls = await railwayScraping();
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})

// Server setup
app.listen(3000, () => {
    console.log("Server is Running")
})