const cheerio = require("cheerio")
const axios = require("axios")
var {CohereClientV2} = require("cohere-ai");
var similarity = require( 'compute-cosine-similarity' );
var compareData = require("../embed");
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

    var pages = [];

    var page_url = "https://www.railwaypro.com/wp/";
        
    console.log(page_url);

    var axiosResponse = await axios.request({
            method: "GET",        
            url: page_url,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
            }
    });
    const $ = cheerio.load(axiosResponse.data)

    $(".menu-item-object-category").each((ind, el) => {
        $(el).find("a").each(async (ind, lnk) => {
            pages.push($(lnk).attr("href"));
        });
    });

    for (var page_each of pages){
        let headlines = [];
        for (var i=0;i<=3;i++){
            var sub_page_url = page_each;

            var lbl = sub_page_url.split('/')[sub_page_url.split('/').length - 2];
            console.log(lbl);
            
            if (i>1)
                sub_page_url = sub_page_url+ "page/"+i;

            const axiosResponse = await axios.request({
                method: "GET",
                url: sub_page_url,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
                }
            });
            const $ = cheerio.load(axiosResponse.data)

            $(".mh-loop-title").each((ind, el) => {
                var obj = {};
                $(el).find("a").each(async (ind, lnk) => {
                    obj["ttle"] = $(lnk).html().trim();
                    obj["lnk"] = $(lnk).attr("href");
                    obj["lbl"] = lbl;

                    /*const pageResp = await axios.request({
                        method: "GET",
                        url: obj["link"],
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
                        }
                    });
                    const $_page = cheerio.load(pageResp.data)
                    
                    obj["content"] = $_page("article").html();

                    obj["desc"] = $($(".mh-loop-excerpt p")[ind]).html().trim();
                    
                    console.log(JSON.stringify(obj["title"]));*/
                    
                    headlines.push(obj);
                });        
            });
        }
    
        var conn = await db_connect();

        console.log(JSON.stringify(headlines));

        try{
            var insertStatement = `insert into ORAHACKS_SCRAPING("TITLE","LABEL","LINK") values(:ttle,:lbl,:lnk)`;

            var binds = headlines.map((each, idx) => ({
                ttle: each.ttle,
                lnk: each.lnk,
                lbl: each.lbl.replace(/\//g,'')
            }));            

            console.log(JSON.stringify(binds));

            var options = {
                autoCommit: false,
                bindDefs: {
                    ttle: { type: oracledb.STRING, maxSize: 5000 },
                    lbl: { type: oracledb.STRING, maxSize: 500 },
                    lnk: { type: oracledb.STRING, maxSize: 5000 }
                }
            };
            
            const results = await conn.executeMany(insertStatement, binds, options);
            
            await conn.commit();
        } catch(ex){
            console.log(ex.message);
        }

        await conn.close();
    
        //return classify;
    }
}

async function classifyData(lbl,class_type) {

    var conn = await db_connect();

    const results = await conn.execute(`select "TITLE","LABEL","LINK","CLASSIFICATION","IMAGE_LINK","INDUSTRY","VECTOR", "SENTIMENT" from ORAHACKS_SCRAPING where (UPPER("INDUSTRY") like '%${lbl.toUpperCase()}%' OR  UPPER("LABEL") like '${lbl.toUpperCase()}%')`, []);

    var ls = results.rows.filter(each => {
        var ls = []
        if (each["INDUSTRY"]){
            ls = each["INDUSTRY"].split(",");
        }           

        if (ls.indexOf(lbl.toUpperCase())>=0)
            return true;              

        return false;
    });

    var obj = await getSimilarities(ls);

    var groups = [];

    for (var k of ls.map(each => each["LINK"])){
        var group = [];
        var flg = 0;
        for (var grp of groups){
            if (grp.indexOf(k)>=0){
                flg=1;
                group = grp;
                break;
            }
        }
    
        if (flg == 0){
            group.push(k);
            groups.push(group);
        }
        
        makeGroup(k, group, obj);

    }

    var lnkObj = {};
 
    ls.map(each => {
        delete each["VECTOR"];
        lnkObj[each["LINK"]] = each;
    });

    var finalLs = [];
    for (var grp of groups){
       var found = 0;
       var temp = {};
       var fnd_lnk = '';
       for (var lk of grp){
        if (lnkObj[lk]["CLASSIFICATION"].toUpperCase() !== "SPAM" && lnkObj[lk]["CLASSIFICATION"].toUpperCase() !== "OPPORTUNITY"){
            fnd_lnk=lk;
        }

        if (lnkObj[lk]["CLASSIFICATION"] == "OPPORTUNITY"){
            temp = JSON.parse(JSON.stringify(lnkObj[lk]));
            found=1;
            break;
        }
       }

       if (found==0){
            temp = JSON.parse(JSON.stringify(lnkObj[fnd_lnk]));
       }

       temp["TIMELINE"] = grp.map(each => lnkObj[each]);
       if (grp.length>1)
        finalLs.unshift(temp);
       else 
        finalLs.push(temp);
    }

    await conn.close();

    return finalLs;
}


async function getTimeLine(vector) {

    var conn = await db_connect();

    const results = await conn.execute(`select "TITLE","LABEL","LINK","CLASSIFICATION","IMAGE_LINK","INDUSTRY","VECTOR" from ORAHACKS_SCRAPING `, []);

    var ls = results.rows[0];

    var obj = await getSimilarities(ls);

    var groups = [];

    for (var k of ls.map(each => each["LINK"])){
        var group = [];
        var flg = 0;
        for (var grp of groups){
            if (grp.indexOf(k)>=0){
                flg=1;
                group = grp;
                break;
            }
        }
    
        if (flg == 0){            
            group.push(k);
            groups.push(group);
        }
        
        makeGroup(k, group, obj);

    }

    var lnkObj = {};
 
    ls.map(each => {
        delete each["VECTOR"];
        lnkObj[each["LINK"]] = each;
    });

    var finalLs = [];
    for (var grp of groups){
       var op = [];
       for (var lk of grp){
        op.push(lnkObj[lk]);
       }
       finalLs.push(op);
    }

    await conn.close();

    return finalLs;
}

function makeGroup(k, group, obj){

    if (obj.hasOwnProperty(k)){
      for (var j of obj[k]){
        if (group.indexOf(j)<0){
            group.push(j);
            makeGroup(j, group, obj);
        }
      }
    }
}

async function getSimilarities(inputLs) {
    var obj = {};
    for (var i=0;i<inputLs.length-1;i++){
      for (var j=i+1;j<inputLs.length;j++){
        try{
            var s1 = similarity(JSON.parse(inputLs[i]["VECTOR"]), JSON.parse(inputLs[j]["VECTOR"]));
            if (s1 >= 0.6){
            if (obj.hasOwnProperty(inputLs[i]["LINK"]))
                obj[inputLs[i]["LINK"]].push(inputLs[j]["LINK"]);
            else 
                obj[inputLs[i]["LINK"]]=[inputLs[j]["LINK"]];

            if (obj.hasOwnProperty(inputLs[j]["LINK"]))
                obj[inputLs[j]["LINK"]].push(inputLs[i]["LINK"]);
            else 
                obj[inputLs[j]["LINK"]]=[inputLs[i]["LINK"]];
            }
        } catch(ex){
            console.log(ex.message);
        }
      }
    }
    return obj;
}

async function embedData() {

    var conn = await db_connect();

    console.log(`select * from ORAHACKS_SCRAPING where "VECTOR" IS NULL`);

    const results = await conn.execute(`select "TITLE", "LINK" from ORAHACKS_SCRAPING where "VECTOR" IS NULL`, []);    

    for (var i=0;i<results.rows.length;i+=96){
      
        let predictions = await compareData(results.rows.map(each => each["TITLE"]).slice(i,i+96));

        await updateAnalyticsDetails(results.rows.slice(i,i+96).map(each => each["LINK"]), predictions);
        
    }

    await conn.close();

    return true;
}

async function updateAnalyticsDetails(lnks, predictions) {
  // downloading the target web page
  // by performing an HTTP GET request in Axios

  var conn = await db_connect();                               

  var updateStatement = `update ORAHACKS_SCRAPING set "VECTOR"=:prediction where "LINK"=:lnk`;
                  
  var binds = [];

  var idx =0;
  for (var each of lnks){
      binds.push({
          lnk: each,
          prediction: JSON.stringify(predictions[idx])
      });
      idx++;
  }

  console.log("binds: " + JSON.stringify(binds));

  var options = {
      autoCommit: false,
      bindDefs: {           
          lnk: { type: oracledb.STRING, maxSize: 5000 },
          prediction: { type: oracledb.STRING, maxSize: 32763 }
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

async function getSentiment(lbl,industry) {

    var conn = await db_connect();

    console.log(`select * from ORAHACKS_SCRAPING where UPPER("SENTIMENT") like '%${lbl.toUpperCase()}%' and  UPPER("INDUSTRY") like '%${industry.toUpperCase()}%'`);

    const results = await conn.execute(`select * from ORAHACKS_SCRAPING where UPPER("SENTIMENT") like '%${lbl.toUpperCase()}%' and  UPPER("INDUSTRY") like '%${industry.toUpperCase()}%'`, []);

    var ls = results.rows.filter(each => {
        var ls = []
        if (each["INDUSTRY"]){
            ls = each["INDUSTRY"].split(",");
        }
        
        if (ls.indexOf(industry.toUpperCase())>=0)
            return true;

        return false;
    });

    await conn.close();

    return ls;
}


async function createTraining() {

    var conn = await db_connect();

    console.log(`select "CONTENT" from ORAHACKS_SCRAPING`);
    
    const results = await conn.execute(`select "CONTENT" from ORAHACKS_SCRAPING where "LABEL" like '%wealth%'`, []);

    await conn.close();

    var trainings = results.rows.map(each => ({"text" : each["CONTENT"], "label" : 'RETAIL'}));

    return trainings;
}


module.exports = {
    railwayScraping : railwayScraping,
    classifyData: classifyData,
    embedData: embedData,
    db_connect: db_connect,
    createTraining :createTraining,
    getSentiment: getSentiment
}
