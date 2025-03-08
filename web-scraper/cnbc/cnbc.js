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

async function cnbc_scraper() {
  var pages = [];
  var page_url = "https://www.cnbc.com";
  console.log(page_url);

  var axiosResponse = await axios.request({
      method: "GET",
      url: page_url,
      headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
      }
  });
  const $ = cheerio.load(axiosResponse.data);
  console.log(JSON.stringify(pages));

  for (var page_each of pages) {
      console.log("+++" + page_url + page_each);

      try {
          axiosResponse = await axios.request({
              method: "GET",
              url: page_url + page_each,
              headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
              }
          });
          const $ = cheerio.load(axiosResponse.data);

          $(".Card-standardBreakerCard").each((ind, el) => {
              let obj = {};
              obj["img"] = $(el).find("img").attr("src");
              let headlines = [];

              let articleLinks = $(el).find("a");
              articleLinks.each(async (i, lnk) => {
                  let article = { ...obj };
                  article["ttle"] = $(lnk).text().trim();
                  article["lnk"] = $(lnk).attr("href");
                  article["lbl"] = page_each;

                  try {
                      const pageResp = await axios.request({
                          method: "GET",
                          url: article["lnk"],
                          headers: {
                              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
                          }
                      });

                      const $_page = cheerio.load(pageResp.data);
                      var all_content = [];

                      $_page(".ArticleBody-articleBody p").each((ind, dt) => {
                          all_content.push($(dt).html());
                      });

                      article["content"] = all_content.join();

                      try {
                          if (article["content"])
                              article["content"] = await summarizeText(article["content"]);
                      } catch (ex) {
                          console.log(ex.message);
                      }

                      console.log("__________________________________________________________");
                      console.log(article["content"]);
                      headlines.push(article);

                      try {
                          var conn = await db_connect();
                          console.log(JSON.stringify(headlines));

                          var insertStatement = `INSERT INTO ORAHACKS_SCRAPING("TITLE", "LABEL", "LINK", "CONTENT", "CLASSIFICATION", "IMAGE_LINK") VALUES(:ttle, :lbl, :lnk, :content, :prediction, :imgLink)`;

                          var binds = headlines.map((each) => ({
                              ttle: each.ttle.substr(0, 5000),
                              lbl: each.lbl.replace(/\//g, ''),
                              lnk: each.lnk,
                              content: each.content.replace(/['"`]/g, '').substr(0, 10000),
                              prediction: 'OPPORTUNITY',
                              imgLink: each.img || ''
                          }));

                          var options = {
                              autoCommit: false,
                              bindDefs: {
                                  ttle: { type: oracledb.STRING, maxSize: 5000 },
                                  lbl: { type: oracledb.STRING, maxSize: 500 },
                                  lnk: { type: oracledb.STRING, maxSize: 5000 },
                                  imgLink: { type: oracledb.STRING, maxSize: 5000 },
                                  content: { type: oracledb.STRING, maxSize: 10000 },
                                  prediction: { type: oracledb.STRING, maxSize: 500 }
                              }
                          };

                          if (binds.length) {
                              var results = await conn.executeMany(insertStatement, binds, options);
                              console.log(JSON.stringify(results));
                          }

                          await conn.commit();
                          await conn.close();
                      } catch (ex) {
                          console.log(ex.message);
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
}

async function cnbc_classification() {
  var conn = await db_connect();
  var selectStatement = `SELECT * FROM ORAHACKS_SCRAPING WHERE "LINK" LIKE '%cnbc%'`;
  const results = await conn.execute(selectStatement, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
  await conn.close();

  for (var i = 0; i < results.rows.length; i++) {
      var ls = results.rows.map(each => each["CONTENT"]).slice(i, i + 96);
      var predictions = await classifyData(ls);

      console.log("predictions:" + JSON.stringify(predictions));
      console.log(JSON.stringify(results.rows.slice(i, i + 96).map(each => each["LINK"])));

      await updateAnalyticsDetails(results.rows.slice(i, i + 96).map(each => each["LINK"]), predictions);
      i += 96;
  }
}

async function updateAnalyticsDetails(lnks, predictions) {
  var conn = await db_connect();
  var updateStatement = `UPDATE ORAHACKS_SCRAPING SET "CLASSIFICATION" = :prediction WHERE "LINK" = :lnk`;
  var binds = lnks.map((each, idx) => ({ lnk: each, prediction: predictions[idx] }));
  var options = {
      autoCommit: false,
      bindDefs: {
          lnk: { type: oracledb.STRING, maxSize: 5000 },
          prediction: { type: oracledb.STRING, maxSize: 500 }
      }
  };

  if (binds.length) {
      var results = await conn.executeMany(updateStatement, binds, options);
      console.log(JSON.stringify(results));
  }
  await conn.commit();
  await conn.close();
}

module.exports = {
  cnbc_scraper,
  cnbc_classification,
  updateAnalyticsDetails,
  db_connect
};