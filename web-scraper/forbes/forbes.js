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

async function forbes() {
  const base_url = "https://www.forbes.com";
  const page_url = `${base_url}`;

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
    console.error("Error fetching Bloomberg Asia page:", error.message);
    return;
  }

  const $ = cheerio.load(axiosResponse.data);

  console.log("Page content fetched successfully");

  let menuLinks = [];

  // Extract menu links from the specific div
  // Extracting menu links
  $('div.ul.li.div.R0tvspq-').each((index, element) => {
    const menuText = $(element).text().trim();
    const menuLink = $(element).find("a").attr("href");

    if (menuLink) {
      const fullLink = menuLink.startsWith("http")
        ? menuLink
        : base_url + menuLink;
      menuLinks.push({ name: menuText, link: fullLink });
      console.log("Menu Link:", fullLink);
    }
  });
  // return classify;
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
  forbes: forbes,
  classifyData: classifyData,
  db_connect: db_connect,
};
