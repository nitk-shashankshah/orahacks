const cheerio = require("cheerio");
const axios = require("axios");
var { CohereClientV2 } = require("cohere-ai");
//const cohere = require('cohere-ai');
const oracledb = require("oracledb");
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

async function cnn() {
    const base_url = "https://edition.cnn.com";
    const page_url = "https://edition.cnn.com/business";

    console.log("Fetching main page:", page_url);

    let axiosResponse;
    try {
        axiosResponse = await axios.get(page_url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
            },
        });
    } catch (error) {
        console.error("Error fetching  page:", error.message);
        return;
    }

    const $ = cheerio.load(axiosResponse.data);
    let menuLinks = [];

    // Extracting menu links
    $(".header__nav-item").each((index, element) => {
        const menuText = $(element).attr("aria-label") || $(element).text().trim();
        const menuLink = $(element).find("a").attr("href");

        if (menuLink) {
            const fullLink = menuLink.startsWith("http") ? menuLink : base_url + menuLink;
            menuLinks.push({ name: menuText, link: fullLink });
            console.log("Menu Link:", fullLink);
        }
    });
    
    // Extracting headlines from each menu link
    for (const { name, link } of menuLinks) {
        console.log("\nScraping:", link);


        try {
            axiosResponse = await axios.get(link, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                },
            });


            const $ = cheerio.load(axiosResponse.data);

            // Using `data-testid="headline"` to extract headlines
            $('.container__headline-text').each(async (ind, el) => {

                console.log(base_url+$(el).parent().parent().parent().attr("href"));

                let obj = {
                    ttle: $(el).text().trim(),
                    lnk: base_url+$(el).parent().parent().parent().attr("href"),
                    lbl: name.replace(/\//g, ""),
                };

                try{

                    let headlines = [];

                    const pageResp = await axios.request({
                      method: "GET",
                      url: obj["lnk"],
                      headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
                      }
                    });

                    const $_page = cheerio.load(pageResp.data)
                    var all_content = [];
                                
                    console.log("length: " +$_page(".article__content-container").length);

                    $_page(".article__content-container").each((ind2, el2) => {
                      $(el2).find("p").each((ind, dt) => {
                          all_content.push($(dt).html().trim());
                          console.log($(dt).html().trim());
                      });
                    });

                    obj["content"] = all_content.join().replace(/\'/g,'').replace(/\”/g,'').toString().substring(0,10000);
                    headlines.push(obj);

                    if (headlines.length > 0) {
                      try {
                      var conn = await db_connect();
            
                      console.log(JSON.stringify(headlines));
            
                      var insertStatement = `insert into ORAHACKS_SCRAPING("TITLE","LABEL","LINK","CONTENT") values(:ttle,:lbl,:lnk,:content)`;
            
                      var binds = headlines.map((each, idx) => ({
                        ttle: each.ttle.substring(0,5000),
                        lbl: each.lbl.replace(/\//g,''),
                        lnk: each.lnk,
                        content: each.content.replace(/\"/g,'').replace(/\'/g,'').replace(/\”/g,'').substring(0,10000)
                      }));
            
                      console.log(JSON.stringify(binds));
            
                      var options = {
                        autoCommit: false,
                        bindDefs: {
                          ttle: { type: oracledb.STRING, maxSize: 5000 },
                          lbl: { type: oracledb.STRING, maxSize: 500 },
                          lnk: { type: oracledb.STRING, maxSize: 5000 },
                          content: { type: oracledb.STRING, maxSize: 10000 }
                        },
                      };
            
                      var results = await conn.executeMany(insertStatement, binds, options);
            
                      console.log(JSON.stringify(results));
            
                      await conn.commit();
            
                      await conn.close();
            
                      return;
                    } catch (ex) {
                      console.log(ex.message);
                    }
                  }

                } catch(ex) {
                    console.log(ex.message);
                }

            });


        } catch (ex) {
            console.log("Error fetching headlines:", ex.message);
            continue;
        }

        // Insert extracted headlines into Oracle DB
  }

  //return classify;
}

async function classifyData() {
  var conn = await db_connect();

  const results = await conn.execute("select * from ORAHACKS_SCRAPING", []);

  console.log(JSON.stringify(results));

  const classify = await cohere.classify({
    model: "7939a9db-b48e-414c-93d6-7876d475061f-ft",
    inputs: results.rows.map((each) => each["TITLE"]).slice(0, 96),
  });

  console.log(JSON.stringify(classify));

  await conn.commit();

  await conn.close();

  return classify;
}

module.exports = {
  cnn: cnn,
  classifyData: classifyData,
  db_connect: db_connect,
};
