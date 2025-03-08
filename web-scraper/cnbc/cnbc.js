const cheerio = require("cheerio");
const axios = require("axios");
var { CohereClientV2 } = require("cohere-ai");
//const cohere = require('cohere-ai');
const oracledb = require("oracledb");
const summarizeText = require("../summarize");
const classifyData = require("../classify");

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const cohere = new CohereClientV2({
  token: "2l7u7rXSsFSKEZBC6CGw87kg8iK7JyvadnUzV1Gf",
});

async function db_connect() {
  const connection = await oracledb.getConnection({
    user: "ADMIN",
    password: "Or@hacks2025",
    connectionString:
      '(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.ap-mumbai-1.oraclecloud.com))(connect_data=(service_name=g6dd5b83783d7f9_orahacks_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes))(ssl_server_cert_dn="CN=adwc.uscom-east-1.oraclecloud.com, O=Oracle Corporation, L=Redwood City, ST=California, C=US"))',
    externalAuth: false,
    walletLocation: "../Wallet_orahacks",
    walletPassword: "Or@hacks123",
  });

  return connection;
}

async function scraper() {
  // downloading the target web page
  // by performing an HTTP GET request in Axios

  var pages = [];

  var page_url = "https://www.cnbc.com";

  console.log(page_url);

  var axiosResponse = await axios.request({
    method: "GET",
    url: page_url,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
    },
  });
  const $ = cheerio.load(axiosResponse.data);

  $(".nav-menu-primaryLink").each((ind, el) => {
    $(el)
      .find("a")
      .each(async (ind, lnk) => {
        pages.push($(lnk).attr("href"));
      });
  });

  console.log(JSON.stringify(pages));

  for (var page_each of pages) {
    console.log("+++" + page_url + page_each);

    try {
      axiosResponse = await axios.request({
        method: "GET",
        url: page_url + page_each,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        },
      });
      const $ = cheerio.load(axiosResponse.data);

      $(".Card-standardBreakerCard").each((ind, el) => {
        let obj = {};

        // Extract image (each article should get its corresponding image)
        obj["img"] = $(el).find("img").attr("src");

        let headlines = [];

        // Extract titles & links
        let articleLinks = $(el).find("a");
        articleLinks.each(async (i, lnk) => {
          let article = { ...obj }; // Clone object to avoid overwriting previous articles

          article["ttle"] = $(lnk).text().trim();
          article["lnk"] = $(lnk).attr("href");
          article["lbl"] = page_each;

          try {
            const pageResp = await axios.request({
              method: "GET",
              url: article["lnk"],
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
              },
            });

            const $_page = cheerio.load(pageResp.data);
            let all_content = [];

            $_page(".ArticleBody-articleBody").each((ind2, el2) => {
              $(el2)
                .find("p")
                .each((ind, dt) => {
                  all_content.push($(dt).text().trim());
                });
            });

            article["content"] = all_content.join(" ");
            article["updated_time"] =
              $_page("time[data-testid='lastpublished-timestamp']").attr(
                "datetime"
              ) || "N/A";

            try {
              if (article["content"]) {
                article["content"] = await summarizeText(article["content"]);
              }
            } catch (ex) {
              console.log("Summarization error:", ex.message);
            }

            console.log(
              "__________________________________________________________"
            );
            console.log(article["content"]);

            let prediction = await classifyData(article["content"]);

            article["prediction"] = prediction;
            headlines.push(article);

            // Insert into database
            try {
              let conn = await db_connect();
              console.log("Saving data:", JSON.stringify(headlines));

              let insertStatement = `INSERT INTO ORAHACKS_SCRAPING("TITLE", "LABEL", "LINK", "CONTENT", "CLASSIFICATION", "IMAGE_LINK") 
                                                    VALUES(:ttle, :lbl, :lnk, :content, :prediction, :img)`;

              let binds = headlines.map((each) => ({
                ttle: each.ttle.substr(0, 5000),
                lbl: each.lbl.replace(/\//g, ""),
                lnk: each.lnk,
                content: each.content.replace(/['"`]/g, "").substr(0, 10000),
                prediction: each.prediction,
                img: each.img,
              }));

              console.log("Binds:", JSON.stringify(binds));

              let options = {
                autoCommit: true,
                bindDefs: {
                  ttle: { type: oracledb.STRING, maxSize: 5000 },
                  lbl: { type: oracledb.STRING, maxSize: 500 },
                  lnk: { type: oracledb.STRING, maxSize: 5000 },
                  content: { type: oracledb.STRING, maxSize: 10000 },
                  prediction: { type: oracledb.STRING, maxSize: 500 },
                  img: { type: oracledb.STRING, maxSize: 5000 },
                },
              };

              if (binds.length > 0) {
                let results = await conn.executeMany(
                  insertStatement,
                  binds,
                  options
                );
                console.log("DB Insert Results:", JSON.stringify(results));
              }

              await conn.close();
            } catch (ex) {
              console.log("DB Error:", ex.message);
            }
          } catch (ex) {
            console.log(ex.message);
          }
        });
      });
    } catch (ex) {
      console.log(ex.message);
    }
  }

  //return classify;
}

module.exports = {
  scraper: scraper,
  classifyData: classifyData,
  db_connect: db_connect,
};
