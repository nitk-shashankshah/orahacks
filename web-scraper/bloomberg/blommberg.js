const cheerio = require("cheerio");
const axios = require("axios");
var { CohereClientV2 } = require("cohere-ai");
//const cohere = require('cohere-ai');
const oracledb = require("oracledb");
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const cohere = new CohereClientV2({
  token: "FAkelchNnrqTDiWqN32bnBykS1wmn12wKJMAuTZi",
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

async function bloomberg() {
    const base_url = "https://www.bloomberg.com";
    const page_url = `${base_url}/asia`;

    console.log("Fetching main page:", page_url);

    let axiosResponse;
    try {
        axiosResponse = await axios.get(page_url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
            },
        });
    } catch (error) {
        console.error("Error fetching Bloomberg Asia page:", error.message);
        return;
    }

    const $ = cheerio.load(axiosResponse.data);
    let menuLinks = [];

    // Extracting menu links
    $("ul.media-ui-MenuDesktop_menuItemsContainer-7zYb93iB0fw- li").each((index, element) => {
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

        let headlines = [];

        try {
            axiosResponse = await axios.get(link, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                },
            });

            const $ = cheerio.load(axiosResponse.data);

            // Using `data-testid="headline"` to extract headlines
            $('[data-testid="headline"]').each((ind, el) => {
                let obj = {
                    ttle: $(el).text().trim(),
                    lnk: link,
                    lbl: name.replace(/\//g, ""),
                };
                headlines.push(obj);
            });

            console.log("Extracted Headlines:", headlines);
        } catch (ex) {
            console.log("Error fetching headlines:", ex.message);
            continue;
        }

        // Insert extracted headlines into Oracle DB
        if (headlines.length > 0) {
            try {
                const conn = await db_connect();

                const insertStatement = `INSERT INTO ORAHACKS_SCRAPING("TITLE","LABEL","LINK") VALUES(:ttle,:lbl,:lnk)`;

                const binds = headlines.map(each => ({
                    ttle: each.ttle,
                    lnk: each.lnk,
                    lbl: each.lbl,
                }));

                const options = {
                    autoCommit: true,
                    bindDefs: {
                        ttle: { type: oracledb.STRING, maxSize: 5000 },
                        lbl: { type: oracledb.STRING, maxSize: 500 },
                        lnk: { type: oracledb.STRING, maxSize: 5000 },
                    },
                };

                const results = await conn.executeMany(insertStatement, binds, options);
                console.log("DB Insert Results:", results);

                await conn.close();
            } catch (ex) {
                console.log("Database Error:", ex.message);
            }
        }

    try {
      var conn = await db_connect();

      console.log(JSON.stringify(headlines));

      var insertStatement = `insert into ORAHACKS_SCRAPING("TITLE","LABEL","LINK") values(:ttle,:lbl,:lnk)`;

      var binds = headlines.map((each, idx) => ({
        ttle: each.ttle,
        lnk: each.lnk,
        lbl: each.lbl.replace(/\//g, ""),
      }));

      console.log(JSON.stringify(binds));

      var options = {
        autoCommit: false,
        bindDefs: {
          ttle: { type: oracledb.STRING, maxSize: 5000 },
          lbl: { type: oracledb.STRING, maxSize: 500 },
          lnk: { type: oracledb.STRING, maxSize: 5000 },
        },
      };

      var results = await conn.executeMany(insertStatement, binds, options);

      console.log(JSON.stringify(results));

      await conn.commit();

      await conn.close();
    } catch (ex) {
      console.log(ex.message);
    }
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
  bloomberg: bloomberg,
  classifyData: classifyData,
  db_connect: db_connect,
};
