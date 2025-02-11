const cheerio = require("cheerio")
const axios = require("axios")
var {CohereClientV2} = require("cohere-ai");
//const cohere = require('cohere-ai');
const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const cohere = new CohereClientV2({
    token: "2l7u7rXSsFSKEZBC6CGw87kg8iK7JyvadnUzV1Gf",
});

async function db_connect(){
    const connection = await oracledb.getConnection ({
        user          :  'ADMIN',
        password      : 'Or@hacks2025',
        connectionString : '(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.ap-mumbai-1.oraclecloud.com))(connect_data=(service_name=g6dd5b83783d7f9_orahacks_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes))(ssl_server_cert_dn="CN=adwc.uscom-east-1.oraclecloud.com, O=Oracle Corporation, L=Redwood City, ST=California, C=US"))',
        externalAuth  : false,
        walletLocation : '../Wallet_orahacks',
        walletPassword : 'Or@hacks123'
    });

    return connection;
}


async function railwayScraping() {
    // downloading the target web page
    // by performing an HTTP GET request in Axios

    var conn = await db_connect();

    var headlines = [];
    for (var i=0;i<=10;i++){
        var page_url = "https://www.railwaypro.com/wp/category/latest-news/infrastructure/";
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

        $(".mh-loop-title").each((ind, el) => {
            var obj = {};
            $(el).find("a").each(async (ind, lnk) => {
                obj["title"] = $(lnk).html().trim();
                obj["link"] = $(lnk).attr("href");

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
                
                headlines.push(obj["title"]);
            });        
        });
    }
    
    console.log(JSON.stringify(headlines));

    var insertStatement = `insert into ORAHACKS_SCRAPING("TITLE") values(:ttle)`;

    const binds = headlines.map((each, idx) => ({
      ttle: each
    }));            

    console.log(JSON.stringify(binds));

    const options = {
        autoCommit: false,
        bindDefs: {
            ttle: { type: oracledb.STRING, maxSize: 1000 }
        }
    };
    
    const results = await conn.executeMany(insertStatement, binds, options);
    
    await conn.commit();

    await conn.close();
    
    //return classify;
}

async function classifyData() {

    var conn = await db_connect();

    const results = await conn.execute('select * from ORAHACKS_SCRAPING', []);

    console.log(JSON.stringify(results));

    const classify = await cohere.classify({
        model: '7939a9db-b48e-414c-93d6-7876d475061f-ft',
        inputs: results.rows.map(each => each["TITLE"]).slice(0,96)
    });

    console.log(JSON.stringify(classify));

    await conn.commit();

    await conn.close();

    return classify;
}

module.exports = {
    railwayScraping : railwayScraping,
    classifyData: classifyData,
    db_connect: db_connect
}
