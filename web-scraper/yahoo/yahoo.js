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
  console.log("Fetching main page:", base_url);

  let menuLinks = [];

  const https = require("https");
  const agent = new https.Agent({ maxHeaderSize: 32768 });

  try {
    const axiosResponse = await axios.get(base_url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      },
      timeout: 10000,
      httpsAgent: agent,
    });

    const $ = cheerio.load(axiosResponse.data);

    // Extracting menu links
    $("li._yb_14z3wb2").each((index, element) => {
      const menuText =
        $(element).attr("aria-label") || $(element).text().trim();
      const menuLink = $(element).find("a").attr("href");

      if (menuLink) {
        const fullLink = menuLink.startsWith("http")
          ? menuLink
          : base_url + menuLink;
        menuLinks.push({ name: menuText, link: fullLink });
        console.log("Menu Link:", fullLink);
      }
    });
  } catch (error) {
    console.error("Error fetching Yahoo Finance:", error.message);
    return;
  }

  for (const { name, link } of menuLinks) {
    console.log("\nScraping:", link);

    let headlines = [];
    await new Promise((r) => setTimeout(r, 2000)); // 2s delay to prevent rate limits

    try {
      const axiosResponse = await axios.get(link, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
        },
        timeout: 10000,
      });

      if (axiosResponse.data.length > 5000000) {
        console.warn("Warning: Response size exceeds 5MB limit. Skipping...");
        continue;
      }

      const $ = cheerio.load(axiosResponse.data);

      $(".titles h1, .titles h2, .titles h3").each((ind, el) => {
        let parent = $(el).closest("section");
        let articleLink = parent.find("a.subtle-link").attr("href");
        let imageLink = parent.find("img").attr("src");

        if (articleLink) {
          let fullArticleLink = articleLink.startsWith("http")
            ? articleLink
            : base_url + articleLink;
          let obj = {
            title: $(el).text().trim(),
            link: fullArticleLink,
            imageLink: imageLink ? imageLink.trim() : "",
            content: "",
          };

          headlines.push(obj);
        }
      });

      try {
        const pageResp = await axios.request({
          method: "GET",
          url: obj["lnk"],
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
          },
        });
        const $_page = cheerio.load(pageResp.data);
        var all_content = [];

        $_page(".atoms-wrapper").each((ind2, el2) => {
          $(el2)
            .find("p")
            .each((ind, dt) => {
              all_content.push($(dt).html().trim());
            });
        });

        obj["content"] = all_content
          .join()
          .replace(/\'/g, "")
          .replace(/\”/g, "")
          .toString()
          .substring(0, 10000);

        var summary = "";
        //var prediction = "";
        try {
          if (obj["content"]) {
            summary = await summarizeText(obj["content"]);
            console.log("______________________________");
            prediction = await classifyData(summary);
            //console.log(JSON.stringify(prediction));
            obj["content"] = summary;
            headlines.push(obj);
            console.log("---------------------------->:", summary);
          }
        } catch (ex) {
          //console.log(ex.message);
        }
      } catch (ex) {}

      console.log("Extracted Headlines:", headlines);
    } catch (ex) {
      console.log("Error fetching headlines:", ex.message);
      continue;
    }

    // Save data to database
    if (headlines.length > 0) {
      try {
        const conn = await db_connect();
        const insertStatement = `insert into ORAHACKS_SCRAPING("TITLE","LABEL","LINK","CONTENT","CLASSIFICATION","IMAGE_LINK") values(:ttle,:lbl,:lnk,:content,:prediction,:imgLink)`;

        var binds = headlines.map((each, idx) => ({
          ttle: each.ttle.substring(0, 5000),
          lbl: each.lbl.replace(/\//g, ""),
          lnk: each.lnk,
          content: summary.replace(/\'/g, "").replace(/\`/g, ""),
          prediction: prediction,
          imgLink: each.imageLink,
        }));

        var options = {
          autoCommit: false,
          bindDefs: {
            ttle: { type: oracledb.STRING, maxSize: 5000 },
            lbl: { type: oracledb.STRING, maxSize: 500 },
            lnk: { type: oracledb.STRING, maxSize: 5000 },
            content: { type: oracledb.STRING, maxSize: 10000 },
            prediction: { type: oracledb.STRING, maxSize: 100 },
            imgLink: { type: oracledb.STRING, maxSize: 5000 },
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
  const conn = await db_connect();
  const results = await conn.execute("SELECT * FROM ORAHACKS_SCRAPING", []);

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
