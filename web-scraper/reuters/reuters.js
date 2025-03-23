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

async function reuters_scraper() {
    // downloading the target web page
    // by performing an HTTP GET request in Axios

    var headlines=[];
    var pgs = [];

    var page_url = "https://www.bloomberg.com/technology";

    console.log(page_url);

    pgs.push({"label":'Technology', "page": "https://www.bloomberg.com/technology"});
    pgs.push({"label":'Industries', "page": "https://www.bloomberg.com/industries"});

    for (var page_url of pgs){
    var axiosResponse = await axios.request({
            method: "GET",        
            url: page_url["page"],
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
            }
    });
    var $ = cheerio.load(axiosResponse.data)

    $(".SectionFrontHeaderBrand_link__JxlxC a").each((ind, el) => {
        console.log($(el).html());
       // $(el).find("a").each(async (ind, lnk) => {
        pgs.push({"label":$(el).html(), "page": $(el).attr("href")});
       // });
    });

    console.log(JSON.stringify(pgs));

    for (var page_each of pgs){
        try {
            var obj = {};
            axiosResponse = await axios.request({
                    method: "GET",        
                    url: page_each["page"],
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
                    }
            });

            $ = cheerio.load(axiosResponse.data)

            $(".LineupContentArchive_itemContainer__jXMs_").each(async (ind1,card)=>{

                var image = $(card).find(".Media_linkedImage__1R4j5");
                var titleContainers = $(card).find(".Headline_phoenix__Dvz0u");

                var anchorLink = $(card).find(".LineupContentArchive_storyLink__Umeq4");

                anchorLink.each((ind, ech_lnk) => {
                    obj["link"] = 'https://www.bloomberg.com'+ $(ech_lnk).attr("href");
                });

                obj["label"] = page_each["label"];             
                
                obj["title"] = $(titleContainers).find('span').html();    

                var pics = $(image).find('picture');

                var img_lnk = '#';
                pics.each((ind3,pic) => {
                    $(pic).find('source').each((ind4,srce) => {
                        if (ind4==0)
                            img_lnk = $(srce).attr('srcset');
                    });
                });


                if (img_lnk && img_lnk.split(",").length)
                  img_lnk = img_lnk.split(",")[1];
                
                if (img_lnk && img_lnk.trim().split(" ").length)
                  img_lnk = img_lnk.trim().split(" ")[0];

                console.log(img_lnk);
                
                obj["img_lnk"] = img_lnk;

                if (headlines.filter(each => (each["link"] ==  obj["link"])).length == 0){
                    headlines.push(obj);
                    console.log(JSON.stringify(obj));
                    console.log("===========================");

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

                  try {
                                  
                    var prediction = "OPPORTUNITY";

                    var insertStatement = `insert into ORAHACKS_SCRAPING("TITLE","LABEL","LINK","CONTENT","CLASSIFICATION","IMAGE_LINK") values(:ttle,:lbl,:lnk,:content,:prediction,:imgLink)`;

                    headlines.slice(headlines.length -1, headlines.length).map(async (each, idx) => {

                        var binds = [{
                            ttle: each.title.replace(/\'/g, "").replace(/\`/g, "").replace(/\’/g, ""),
                            lbl: each.label.replace(/\//g, ""),
                            lnk: each.link,
                            content: each.title.replace(/\'/g, "").replace(/\`/g, "").replace(/\’/g, ""),
                            prediction: prediction,
                            imgLink: each.img_lnk
                        }];
                    
                        console.log(JSON.stringify(binds));
                    
                        try{

                            var conn = await db_connect();

                            var results = await conn.executeMany(
                            insertStatement,
                            binds,
                            options
                            );

                            console.log(JSON.stringify(results));

                            await conn.commit();

                            await conn.close();

                        } catch(ex){
                            console.log(ex.message);
                        }
                    });

                  } catch (ex) {
                    console.log(ex.message);
                  }


                }

            });
        } catch(ex){
            console.log(ex.message);
        }    
    }

    console.log(JSON.stringify(headlines));

    console.log(JSON.stringify(headlines.length));

    }
    //return classify;
}

async function reuters_industry_classification() {
    // downloading the target web page
    // by performing an HTTP GET request in Axios

    var conn = await db_connect();
                               
    var selectStatement = `select * from ORAHACKS_SCRAPING where "LINK" like '%www.bloomberg.com%' and "INDUSTRY" IS NULL`;
    
    const results = await conn.execute(selectStatement, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
   
    await conn.close();

    for (var i=0;i<results.rows.length;i++){
        var ls = results.rows.map(each=>each["CONTENT"]).slice(i,i+96);
        
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

async function reuters_classification() {
    // downloading the target web page
    // by performing an HTTP GET request in Axios

    var industries = ['TECH','HEALTHCARE','AI','SPORT','SEMICONDUCTORS'];
                        
    for (var industry of industries){

        var conn = await db_connect();

        var selectStatement = `select * from ORAHACKS_SCRAPING where "LINK" like '%www.bloomberg.com%' and ("INDUSTRY" in ('${industry.toUpperCase()}') OR UPPER("LABEL") LIKE ('%${industry.toUpperCase()}%'))`;
        
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

async function reuters_sentiment_analysis() {
    // downloading the target web page
    // by performing an HTTP GET request in Axios                    

    var conn = await db_connect();

    var selectStatement = `select * from ORAHACKS_SCRAPING where "LINK" like '%www.bloomberg.com%'`;
        
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


async function reuters_get_content() {

    var conn = await db_connect();
                               
    var selectStatement = `select * from ORAHACKS_SCRAPING where "LINK" like '%www.bloomberg.com%' and ("CONTENT"='' or "CONTENT" IS NULL or LOWER("TITLE")=LOWER("CONTENT"))`;
    
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

module.exports = {
    reuters_scraper : reuters_scraper,
    reuters_classification: reuters_classification,
    reuters_industry_classification : reuters_industry_classification,
    db_connect: db_connect,
    reuters_get_content: reuters_get_content,
    reuters_sentiment_analysis: reuters_sentiment_analysis
}
