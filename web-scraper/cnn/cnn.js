const cheerio = require("cheerio");
const axios = require("axios");
var { CohereClientV2 } = require("cohere-ai");
//const cohere = require('cohere-ai');
const oracledb = require("oracledb");
const summarizeText = require("../summarize.js");
const classifyData = require("../classify.js");
const industryClassifyData = require('../industryClassify');
const sentimentAnalysis = require('../sentiment');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

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

async function cnn() {
  const base_url = "https://edition.cnn.com";
  var conn = await db_connect();

  for (var page_url of ["https://edition.cnn.com/business","https://edition.cnn.com/health","https://edition.cnn.com/sport"]){

    console.log("Fetching main page:", page_url);

    let axiosResponse;
    try {
      axiosResponse = await axios.get(page_url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        },
      });
    } catch (error) {
      console.error("Error fetching  page:", error.message);
      return;
    }

    const $ = cheerio.load(axiosResponse.data);
    let menuLinks = [];
    menuLinks.push({ name: "sports", link: page_url });
    // Extracting menu links
    $(".header__nav-item").each((index, element) => {
      const menuText =
        $(element).attr("aria-label") || $(element).text().trim();
      const menuLink = $(element).find("a").attr("href");

      if (menuLink) {
        const fullLink = menuLink.startsWith("http")
          ? menuLink
          : base_url + menuLink;
        menuLinks.push({ name: menuText, link: fullLink });
        //console.log("Menu Link:", fullLink);
      }
    });


    // Extracting headlines from each menu link
    for (const { name, link } of menuLinks) {


      console.log("\nScraping:", link);

      try {
        axiosResponse = await axios.get(link, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
          },
        });

        const $ = cheerio.load(axiosResponse.data);

        $(".card").each((ind1, card) => {
          var images = $(card).find(".image__container");
          var titleContainers = $(card).find(".container__headline-text");

          titleContainers.each(async (ind2, el) => {

            var pics = $(images[ind2]).find("picture");

            var img_lnk = "";
            pics.each((ind3, pic) => {
              $(pic)
                .find("source")
                .each((ind4, srce) => {
                  if (ind4 == 0) img_lnk = $(srce).attr("srcset");
                });
            });

            console.log(img_lnk);

            //console.log($(el).text().trim());

            let obj = {
              ttle: $(el).text().trim(),
              lnk: base_url + $(el).parent().parent().parent().attr("href"),
              lbl: name.replace(/\//g, ""),
              imageLink: img_lnk
            };
            console.log(JSON.stringify(obj));

            try {            
              var summary = "";
              //var prediction = "";
              try {
                  let headlines = [];

                  //summary = await summarizeText(obj["content"]);
                  //console.log("______________________________");
                  //prediction = await classifyData(summary);
                  //console.log(JSON.stringify(prediction));
                  obj["content"] = summary;
                  headlines.push(obj);


                  if (headlines.length > 0) {

                    for (var x=0;x<headlines.length;x++){
                      try {

                        console.log(JSON.stringify(headlines));

                        var prediction = "OPPORTUNITY";

                        var insertStatement = `insert into ORAHACKS_SCRAPING("TITLE","LABEL","LINK","CONTENT","CLASSIFICATION","IMAGE_LINK") values(:ttle,:lbl,:lnk,:content,:prediction,:imgLink)`;

                        var binds = headlines.slice(x,x+1).map((each, idx) => ({
                          ttle: each.ttle.substring(0, 5000),
                          lbl: each.lbl.replace(/\//g, ""),
                          lnk: each.lnk,
                          content: each["content"].replace(/\'/g, "").replace(/\`/g, "").replace(/\’/g, ""),
                          prediction: prediction,
                          imgLink: each.imageLink
                        }));

                        console.log(JSON.stringify(binds));

                        var options = {
                          autoCommit: false,
                          bindDefs: {
                            ttle: { type: oracledb.STRING, maxSize: 5000 },
                            lbl: { type: oracledb.STRING, maxSize: 500 },
                            lnk: { type: oracledb.STRING, maxSize: 5000 },
                            content: { type: oracledb.STRING, maxSize: 10000 },
                            prediction: { type: oracledb.STRING, maxSize: 100 },
                            imgLink: { type: oracledb.STRING, maxSize: 5000 }
                          }
                        };

                        var results = await conn.executeMany(
                          insertStatement,
                          binds,
                          options
                        );

                        console.log(JSON.stringify(results));

                        await conn.commit();

                      } catch (ex) {
                        console.log(ex.message);
                      }
                    }
                  }
                
              } catch (ex) {
                //console.log(ex.message);
              }
            } catch (ex) {
              //console.log(ex.message);
            }
          });
        });
      } catch (ex) {
        //console.log("Error fetching headlines:", ex.message);
        //continue;
      }
    }

    //await conn.close();
    // Insert extracted headlines into Oracle DB
  }
  //return classify;
}

async function cnn_get_content() {

  var conn = await db_connect();
                             
  var selectStatement = `select * from ORAHACKS_SCRAPING where "LINK" like '%https://edition.cnn.com%' and ("CONTENT"='' or "CONTENT" IS NULL or LOWER("TITLE")=LOWER("CONTENT"))`;
  
  const results = await conn.execute(selectStatement, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

  for (var i=0;i<results.rows.length;i++){

      var obj = {};

      obj["link"] = results.rows[i]["LINK"];

      const pageResp = await axios.request({
          method: "GET",
          url: results.rows[i]["LINK"],
          headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
          }
      });

      const $_page = cheerio.load(pageResp.data)
      var all_content = [];
                          
      $_page(".ArticleBody-articleBody").each((ind2, el2) => {
          $_page(el2).find("p").each(async (ind, dt) => {
              all_content.push($_page(dt).html());
          });
      });

      obj["content"] = all_content.join();
      
      try{
          if (obj["content"])
              obj["content"] = await summarizeText(obj["content"]);           

          await updateContent(obj, conn);
      } catch(ex){
          //console.log(ex.message);
      }        
  }

  await conn.close();

}


async function updateContent(obj, conn) {
  // downloading the target web page
  // by performing an HTTP GET request in Axios

  //var conn = await db_connect();

  var updateStatement = `update ORAHACKS_SCRAPING set "CONTENT"=:content where "LINK"=:lnk`;
                  
  var binds = [];

  binds.push({
      lnk: obj["link"],
      content: obj["content"]
  });

  console.log("binds: " + JSON.stringify(binds));

  var options = {
      autoCommit: false,
      bindDefs: {           
          lnk: { type: oracledb.STRING, maxSize: 5000 },
          content: { type: oracledb.STRING, maxSize: 5000 }
      }
  };
      
  if (binds.length){
      var results = await conn.executeMany(updateStatement, binds, options);            
      console.log(JSON.stringify(results));
  }

  await conn.commit();

  //await conn.close();                            
  //return classify;
}




async function cnn_classification() {
  // downloading the target web page
  // by performing an HTTP GET request in Axios

  var industries = ['TECH','HEALTHCARE','AI','SPORT','SEMICONDUCTORS'];
                      
  for (var industry of industries){

      var conn = await db_connect();

      var selectStatement = `select * from ORAHACKS_SCRAPING where "LINK" like '%https://edition.cnn.com%'`;
      
      const results = await conn.execute(selectStatement, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
  
      for (var i=0;i<results.rows.length;i+=96){
      
          var ls = results.rows.filter(each => ((each["INDUSTRY"] ? each["INDUSTRY"].split(",") : []).indexOf(industry)>=0 ? true : false)).map(each=>each["TITLE"]).slice(i,i+96);
          predictions = await classifyData(ls, industry);

          console.log("ls:" + ls);
          console.log("ls:" + JSON.stringify(ls));

          console.log("industry:" + JSON.stringify(industry));
          console.log("predictions:" + JSON.stringify(predictions));

          await updateAnalyticsDetails(results.rows.filter(each => ((each["INDUSTRY"] ? each["INDUSTRY"].split(",") : []).indexOf(industry)>=0 ? true : false)).slice(i,i+96).map(each => each["LINK"]), predictions);
      }

      await conn.close();
  }

  //return classify;
}
async function updateAnalyticsDetails(lnks, predictions) {
  // downloading the target web page
  // by performing an HTTP GET request in Axios

  var conn = await db_connect();                               

  var updateStatement = `update ORAHACKS_SCRAPING set "CLASSIFICATION"=:prediction where "LINK"=:lnk`;
                  
  var binds = [];

  var idx =0;
  for (var each of lnks){
      binds.push({
          lnk: each,
          prediction: predictions[idx]
      });
      idx++;
  }

  console.log("binds: " + JSON.stringify(binds));

  var options = {
      autoCommit: false,
      bindDefs: {           
          lnk: { type: oracledb.STRING, maxSize: 5000 },
          prediction: { type: oracledb.STRING, maxSize: 500 }
      }
  };
      
  if (binds.length){
      var results = await conn.executeMany(updateStatement, binds, options);            
      console.log(JSON.stringify(results));
  }

  await conn.commit();

  await conn.close();                            
  //return classify;
}

async function cnn_sentiment_analysis() {
  // downloading the target web page
  // by performing an HTTP GET request in Axios                    

  var conn = await db_connect();

  var selectStatement = `select * from ORAHACKS_SCRAPING where "LINK" like '%https://edition.cnn.com%' and "INDUSTRY" IS NOT NULL and "SENTIMENT" IS NULL`;
      
  const results = await conn.execute(selectStatement, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
  
  for (var i=0;i<results.rows.length;i+=96){
    
      var ls = results.rows.map(each=>each["TITLE"]).slice(i,i+96);
      predictions = await sentimentAnalysis(ls);

      await updateSentimentDetails(results.rows.slice(i,i+96).map(each => each["LINK"]), predictions);
  }

  await conn.close();

  //return classify;
}

async function updateSentimentDetails(lnks, predictions) {
  // downloading the target web page
  // by performing an HTTP GET request in Axios

  var conn = await db_connect();                               

  var updateStatement = `update ORAHACKS_SCRAPING set "SENTIMENT"=:prediction where "LINK"=:lnk`;
                  
  var binds = [];

  var idx =0;
  for (var each of lnks){
      binds.push({
          lnk: each,
          prediction: predictions[idx]
      });
      idx++;
  }

  console.log("binds: " + JSON.stringify(binds));

  var options = {
      autoCommit: false,
      bindDefs: {           
          lnk: { type: oracledb.STRING, maxSize: 5000 },
          prediction: { type: oracledb.STRING, maxSize: 500 }
      }
  };

  if (binds.length){
      var results = await conn.executeMany(updateStatement, binds, options);            
      console.log(JSON.stringify(results));
  }

  await conn.commit();

  await conn.close();                            
  //return classify;
}


async function cnn_industry_classification() {
  // downloading the target web page
  // by performing an HTTP GET request in Axios

  var conn = await db_connect();
                             
  var selectStatement = `select * from ORAHACKS_SCRAPING where "LINK" like '%https://edition.cnn.com%'  and "INDUSTRY" IS NULL`;
  
  const results = await conn.execute(selectStatement, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
 
  await conn.close();

  for (var i=0;i<results.rows.length;i++){
      var ls = results.rows.map(each=>each["TITLE"]).slice(i,i+96);
      
      console.log(JSON.stringify(ls));
      
      let predictions = await industryClassifyData(ls);

      console.log("predictions:" + JSON.stringify(predictions));
      //console.log(JSON.stringify(results.rows.slice(i,i+96).map(each => each["LINK"])));

      await updateIndustryDetails(results.rows.slice(i,i+96).map(each => each["LINK"]), predictions);
      i+=96;
  }
  //return classify;
}

async function updateIndustryDetails(lnks, industries) {
  // downloading the target web page
  // by performing an HTTP GET request in Axios

  var conn = await db_connect();                               

  var updateStatement = `update ORAHACKS_SCRAPING set "INDUSTRY"=:industry where "LINK"=:lnk`;
                  
  var binds = [];

  var idx =0;
  for (var each of lnks){
      binds.push({
          lnk: each,
          industry: industries[idx]
      });
      idx++;
  }

  console.log("binds: " + JSON.stringify(binds));

  var options = {
      autoCommit: false,
      bindDefs: {           
          lnk: { type: oracledb.STRING, maxSize: 5000 },
          industry: { type: oracledb.STRING, maxSize: 500 }
      }
  };
      
  if (binds.length){
      var results = await conn.executeMany(updateStatement, binds, options);            
      console.log(JSON.stringify(results));
  }

  await conn.commit();

  await conn.close();                            
  //return classify;
}


module.exports = {
  cnn: cnn,
  db_connect: db_connect,
  cnn_get_content: cnn_get_content,
  cnn_industry_classification: cnn_industry_classification,
  cnn_classification: cnn_classification,
  cnn_sentiment_analysis:cnn_sentiment_analysis
};
