const cheerio = require("cheerio")
const axios = require("axios")

/*
prompt = f"""
Use the information provided below to answer the questions at the end. If the answer to the question is not contained in the provided information, say "The answer is not in the context".
---
Context information:
{context}
---
Question: How many people have won more than one Nobel prize?
""";

prediction_with_search = [
    co.chat(
        messages=[{"role": "user", "content": prompt}],
        model="command-r-plus-08-2024",
        max_tokens=50,
    ) for _ in range(5)
];
*/


async function transportScraping(res) {
    // downloading the target web page
    // by performing an HTTP GET request in Axios

    for (var i=1;i<=1000;i++){
    var page_url = "https://www.railwaypro.com/wp/category/latest-news/public-transport/";
    if (i>1)
        page_url = page_url+ "page/"+i;

    console.log(page_url);

    const axiosResponse = await axios.request({
        method: "GET",        
        url: page_url,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
        }
    });
    const $ = cheerio.load(axiosResponse.data)

    const res1 = [];

    $(".mh-loop-title").each((ind, el) => {
        var obj = {};
        $(el).find('a').each(async (ind, lnk) => {
            obj["title"] = $(lnk).html().trim();
            obj["link"] = $(lnk).attr('href');

            const pageResp = await axios.request({
                method: "GET",
                url: obj["link"],
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
                }
            });
            const $_page = cheerio.load(pageResp.data)
            
            obj["content"] = $_page("article").html();

            obj["desc"] = $($(".mh-loop-excerpt p")[ind]).html().trim();
            
            console.log(JSON.stringify(obj["title"]));
        });        
        
        res1.push(obj);
    });    
    }
}

module.exports = transportScraping;  