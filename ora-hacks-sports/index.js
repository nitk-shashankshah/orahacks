import express from "express";
const app = express();

import fs from "fs";
import path from "path";
import { CohereClient } from "cohere-ai";

// Get the absolute path of response.json
const filePath = path.resolve("response.json");

// Load the JSON response from a local file
const response = JSON.parse(fs.readFileSync(filePath, "utf-8"));

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
    const cohere = new CohereClient({
        token: "FAkelchNnrqTDiWqN32bnBykS1wmn12wKJMAuTZi",
    });


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

app.listen(4000, () => {
    console.log(`Server is running on http://localhost:4000`);
});
