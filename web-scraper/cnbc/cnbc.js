const cheerio = require("cheerio")
const axios = require("axios")
const oracledb = require('oracledb');
const summarizeText = require('../summarize');
const classifyData = require('../classify');
const industryClassifyData = require('../industryClassify');
const sentimentAnalysis = require('../sentiment');


oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

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

async function cnbc_scraper() {
    // downloading the target web page
    // by performing an HTTP GET request in Axios

    var conn = await db_connect();

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
    const $ = cheerio.load(axiosResponse.data)

    $(".nav-menu-subLink").each((ind, el) => {
        console.log($(el).html());
       // $(el).find("a").each(async (ind, lnk) => {
        pages.push($(el).attr("href"));
       // });
    });

    console.log(JSON.stringify(pages));

    for (var page_each of pages){

        console.log("+++" + page_url+page_each);

        try {
            axiosResponse = await axios.request({
                    method: "GET",        
                    url: page_url+page_each,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
                    }
            });
            const $ = cheerio.load(axiosResponse.data)

            $(".Card-card").each((ind1,card)=>{

                var images = $(card).find(".Card-imageContainer");
                var titleContainers = $(card).find(".Card-titleContainer");

                titleContainers.each((ind2, el) => {
                    var obj = {};
                    $(el).find("a").each(async (ind, lnk) => {
                        obj["ttle"] = $(lnk).html().trim();
                        obj["lnk"] = $(lnk).attr("href");
                        obj["lbl"] = page_each;
                        let headlines = [];

                        var pics = $(images[ind2]).find('picture');

                        var img_lnk = '#';
                        pics.each((ind3,pic) => {
                            $(pic).find('source').each((ind4,srce) => {
                                if (ind4==0)
                                    img_lnk = $(srce).attr('srcset');
                            });
                        });

                        try{                              
                            obj["content"] = "";
                            var prediction = '';
                            //if (obj["content"] && obj["content"].trim())
                            //prediction = await classifyData(obj["content"]);

                            headlines.push(obj);

                            try{
                    
                    
                                var insertStatement = `insert into ORAHACKS_SCRAPING("TITLE","LABEL","LINK","CONTENT","CLASSIFICATION","IMAGE_LINK") values(:ttle,:lbl,:lnk,:content,:prediction,:imgLink)`;
                    
                                var binds = headlines.map((each, idx) => ({
                                    ttle: each.ttle.substr(0,5000).replace(/\'/g,'').replace(/\"/g,'').replace(/\`/g,'').replace(/\’/g, ""),
                                    lbl: each.lbl.replace(/\//g,''),
                                    lnk: each.lnk,
                                    content: each.content.replace(/\'/g,'').replace(/\"/g,'').replace(/\`/g,'').replace(/\’/g, "").substr(0,10000),
                                    prediction: prediction,
                                    imgLink: img_lnk ? img_lnk : '#'
                                }));            
            

                                var options = {
                                    autoCommit: false,
                                    bindDefs: {
                                        ttle: { type: oracledb.STRING, maxSize: 5000 },
                                        lbl: { type: oracledb.STRING, maxSize: 500 },
                                        lnk: { type: oracledb.STRING, maxSize: 5000 },
                                        content: { type: oracledb.STRING, maxSize: 10000 },
                                        prediction: { type: oracledb.STRING, maxSize: 500 },
                                        imgLink: { type: oracledb.STRING, maxSize: 5000 }
                                    }
                                }; 

                                        
                                console.log(insertStatement);
                                console.log(JSON.stringify(binds));
                                console.log(JSON.stringify(options));


                                if (binds.length){
                                    var results = await conn.executeMany(insertStatement, binds, options);            
                                    console.log(JSON.stringify(results));
                                }
                    
                                await conn.commit();
                    
                            } catch(ex) {
                                console.log(ex.message);
                            }

                        } catch(ex) {
                            console.log(ex.message);
                        }
                    });
                });
            });           
        } catch(ex){
            console.log(ex.message);
        }    
    }
    await conn.close();

    //return classify;
}

async function cnbc_get_content() {

    var conn = await db_connect();
                               
    var selectStatement = `select * from ORAHACKS_SCRAPING where "LINK" like '%https://www.cnbc.com%' and ("CONTENT"='' or "CONTENT" IS NULL or LOWER("TITLE")=LOWER("CONTENT"))`;
    
    const results = await conn.execute(selectStatement, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
   

    for (var i=0;i<results.rows.length;i++){

        var obj = {};

        obj["link"] = results.rows[i]["LINK"];

        const pageResp = await axios.request({
            method: "GET",
            url: obj["lnk"],
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
            }
        });

        const $_page = cheerio.load(pageResp.data)
        var all_content = [];
                            
        $_page(".ArticleBody-articleBody").each((ind2, el2) => {
            $_page(el2).find("p").each(async (ind, dt) => {
                all_content.push($(dt).html());
            });
        });

        obj["content"] = all_content.join();
        obj["content"] = obj["ttle"];
        try{
            if (obj["content"])
                obj["content"] = await summarizeText(obj["content"]);
            else 
                return;
        } catch(ex){
            console.log(ex.message);
        }
      
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



async function cnbc_industry_classification() {
    // downloading the target web page
    // by performing an HTTP GET request in Axios

    var conn = await db_connect();
                               
    var selectStatement = `select * from ORAHACKS_SCRAPING where "LINK" like '%https://www.cnbc.com%' and "INDUSTRY" IS NULL`;
    
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

async function cnbc_classification() {
    // downloading the target web page
    // by performing an HTTP GET request in Axios


    var industries = ['TECH','HEALTHCARE','AI','SPORT','SEMICONDUCTORS'];
                        
    for (var industry of industries){

        var conn = await db_connect();

        var selectStatement = `select * from ORAHACKS_SCRAPING where "LINK" like '%https://www.cnbc.com%' and "INDUSTRY" like '%${industry.toUpperCase()}%'`;
        
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

async function cnbc_sentiment_analysis() {
    // downloading the target web page
    // by performing an HTTP GET request in Axios                    

    var conn = await db_connect();

    var selectStatement = `select * from ORAHACKS_SCRAPING where "LINK" like '%https://www.cnbc.com%' and "INDUSTRY" IS NOT NULL and "SENTIMENT" IS NULL`;
        
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

module.exports = {
    cnbc_scraper : cnbc_scraper,
    cnbc_classification: cnbc_classification,
    cnbc_industry_classification :cnbc_industry_classification,
    db_connect: db_connect,
    cnbc_get_content: cnbc_get_content,
    cnbc_sentiment_analysis: cnbc_sentiment_analysis
}
