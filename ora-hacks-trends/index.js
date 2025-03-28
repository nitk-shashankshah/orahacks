import express from "express";
const app = express();

import fs from "fs";
import path from "path";
import { CohereClient } from "cohere-ai";

// Get the absolute path of response.json
const filePath = path.resolve("response.json");

// Load the JSON response from a local file
const response = JSON.parse(fs.readFileSync(filePath, "utf-8"));

// Function to process industry specific data
// Get the data in this format:
// [ {"SPORTS": "<all-the-sport-related-content>", ...}]
const processIndustrySpecificData = (data) => {
    var industryData = {};

    data.forEach((row) => {
        if(row.industry && row.content) {
            var industries = row.industry.split(",");
            industries.forEach((industry) => {
                if(!industryData[industry]) {
                    industryData[industry] = "";
                }
                if((industryData[industry] + row["content"]).length < 4096) {
                    industryData[industry] = industryData[industry] + row["content"];
                }
            });
        }
    });
    return industryData;
};

// API route
app.get("/industry/trends", async (req, res) => {

    const industryData = processIndustrySpecificData(response);
    const cohere = new CohereClient({
        token: "FAkelchNnrqTDiWqN32bnBykS1wmn12wKJMAuTZi",
    });
    var industries = Object.keys(industryData);
    var trends = {};

    for(var i=0; i<industries.length; i++) {
        let chat = await cohere.chat({
            model: "command",
            message: `Review the following content and figure out an overall trend in this industry of ${industries[i]} - ` + JSON.stringify(industryData[industries[i]]),
        });
        trends[industries[i]] = chat.text;
    }

    res.json(trends);

});

app.listen(5000, () => {
    console.log(`Server is running on http://localhost:5000`);
});
