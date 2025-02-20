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

async function yahoo() {
  const base_url = "https://finance.yahoo.com";
  const page_url = `${base_url}`;
  console.log("Fetching main page:", page_url);

  let axiosResponse;

  const https = require("https");
  const agent = new https.Agent({ maxHeaderSize: 32768 });

  try {
    axiosResponse = await axios.get(page_url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      },
      timeout: 10000, // 10 seconds timeout
      httpsAgent: agent,
    });
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.error("Rate limit exceeded. Try again later.");
    } else {
      console.error("Error fetching page:", error.message);
    }
    return;
  }

  const $ = cheerio.load(axiosResponse.data);

  let menuLinks = [];

  // Extracting menu links
  $("li._yb_14z3wb2").each((index, element) => {
    const menuText = $(element).attr("aria-label") || $(element).text().trim();
    const menuLink = $(element).find("a").attr("href");

    if (menuLink) {
      const fullLink = menuLink.startsWith("http")
        ? menuLink
        : base_url + menuLink;
      menuLinks.push({ name: menuText, link: fullLink });
      console.log("Menu Link:", fullLink);
    }
  });

  // Extracting headlines from each menu link
  for (const { name, link } of menuLinks) {
    console.log("\nScraping:", link);

    let headlines = [];
    await new Promise((r) => setTimeout(r, 2000)); // Adding 2s delay between requests

    try {
      axiosResponse = await axios.get(link, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        },
        timeout: 10000,
      });

      if (axiosResponse.data.length > 5000000) {
        // 5MB response limit
        console.warn("Warning: Response size exceeds limit. Skipping...");
        continue;
      }

      const $ = cheerio.load(axiosResponse.data);

      $('.titles h1, .titles h2, .titles h3').each((ind, el) => {
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

    if (headlines.length > 0) {
      try {
        const conn = await db_connect();
        const insertStatement = `INSERT INTO ORAHACKS_SCRAPING("TITLE","LABEL","LINK") VALUES(:ttle,:lbl,:lnk)`;

        const binds = headlines.map((each) => ({
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
  }
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
  yahoo: yahoo,
  classifyData: classifyData,
  db_connect: db_connect,
};
