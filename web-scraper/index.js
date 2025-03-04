// Filename - index.js

// Increase max HTTP header size
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

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Import Routes
const clientRoutes = require("./src/routes/clientRoutes");

// Importing scraping functions
const { railwayScraping, classifyData } = require("./railway/railway");
const { scraper } = require("./cnbc/cnbc");
const { bloomberg } = require("./bloomberg/blommberg");
const { yahoo } = require("./yahoo/yahoo");
const { insider } = require("./insider/insider");
const { cnn } = require("./cnn/cnn");
const { marketwatch } = require("./marketwatch/marketwatch");
const { wsj } = require("./wsj/wsj");
const { forbes } = require("./forbes/forbes");

// Initialize Express
const app = express();

// CORS Configuration
let corsOptions = {
    origin: ["*"]
};
app.use(cors(corsOptions));
app.use(bodyParser.json()); // Parse JSON request bodies

// 🔹 **Client API Routes**
app.use('/api/clients', clientRoutes);

// Handling GET /hello request
app.get("/classify", cors(corsOptions), async (req, res, next) => {
    var ls = await classifyData(req.query.label, req.query.classification);
    console.log(JSON.stringify(ls));
    res.send(JSON.stringify(ls));
})

app.get("/load/railway", async (req, res) => {
    try {
        var ls = await railwayScraping();
        console.log(JSON.stringify(ls));
        res.json(ls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error loading railway data" });
    }
});

app.get("/load/cnbc", async (req, res) => {
    try {
        var ls = await scraper();
        console.log(JSON.stringify(ls));
        res.json(ls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error loading CNBC data" });
    }
});

app.get("/load/forbes", async (req, res) => {
    try {
        var ls = await forbes();
        console.log(JSON.stringify(ls));
        res.json(ls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error loading Forbes data" });
    }
});

app.get("/load/bloomberg", async (req, res) => {
    try {
        var ls = await bloomberg();
        console.log(JSON.stringify(ls));
        res.json(ls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error loading Bloomberg data" });
    }
});

app.get("/load/yahoo", async (req, res) => {
    try {
        var ls = await yahoo();
        console.log(JSON.stringify(ls));
        res.json(ls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error loading Yahoo data" });
    }
});

app.get("/load/insider", async (req, res) => {
    try {
        var ls = await insider();
        console.log(JSON.stringify(ls));
        res.json(ls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error loading Insider data" });
    }
});

app.get("/load/cnn", async (req, res) => {
    try {
        var ls = await cnn();
        console.log(JSON.stringify(ls));
        res.json(ls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error loading CNN data" });
    }
});

app.get("/load/marketwatch", async (req, res) => {
    try {
        var ls = await marketwatch();
        console.log(JSON.stringify(ls));
        res.json(ls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error loading MarketWatch data" });
    }
});

app.get("/load/wsj", async (req, res) => {
    try {
        var ls = await wsj();
        console.log(JSON.stringify(ls));
        res.json(ls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error loading WSJ data" });
    }
});

// 🔹 **Start Server**
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
