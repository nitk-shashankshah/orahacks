const cheerio = require("cheerio")
const axios = require("axios")

async function performScraping() {
    // downloading the target web page
    // by performing an HTTP GET request in Axios
    const axiosResponse = await axios.request({
        method: "GET",
        url: "https://brightdata.com",
        headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
        }
    });
    const $ = cheerio.load(axiosResponse.data)

    const marketLeaderReasons = []

    var ls = $(".card_wrapper").find(".card__content").each((index, element) => {
        var lst = $(element).find('.color-titles');

        console.log($(lst[0]).text());

        lst = $(element).find('.card__image');
        
        console.log($(lst[0]).text());
    });
   
    //console.log(ls);

    /*$(".card__content")
    .each((index, element) => {
        console.log($(element).text());
    })*/

    console.log(JSON.stringify(marketLeaderReasons));

}

performScraping()