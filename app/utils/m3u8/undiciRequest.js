let undici = require('undici');
let optionsDefault={
    retry:3,//重试次数
    bodyTimeout:30000,
    headersTimeout:30000,
    maxRedirections:3,//最大跳转次数,如301
    // headers:{
    //     "user-agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
    //     "referer":"https://www.baidu.com"
    // }
};
let retryCount = 0;
async function undiciRequest(url,options){
    if(options){
        Object.assign(optionsDefault,options);
    }
    let retrunData = '';
    try{
        let response = await undici.request(url,optionsDefault);
        if(response.statusCode!==200 && retryCount<optionsDefault.retry){
            retryCount++;
            await undiciRequest(url,optionsDefault);
        } else if(response.statusCode===200){
            let dataAll = [];
            for await (const data of response.body) {
                dataAll.push(data);
            }
            let BufferDataAll = Buffer.concat(dataAll);
            retrunData =  {data:BufferDataAll,url:response.context.history[response.context.history.length-1].href};
        }else{
            let dataAll = [];
            for await (const data of response.body) {
                dataAll.push(data);
            }
            let BufferDataAll = Buffer.concat(dataAll);
            if(response.statusCode){
                let err = Promise.reject({
                    statusCode:response.statusCode,
                    message:BufferDataAll.toString()
                })
                return data = err;
            }else{
                let err = Promise.reject(new Error(BufferDataAll.toString()));
                retrunData = err;
            }
        }
    }catch(e){
        if(retryCount <optionsDefault.retry){
            retryCount++;
            await undiciRequest(url,optionsDefault);
        }else{
            retrunData = Promise.reject(e);
        }
    }
    return retrunData;
}
module.exports = undiciRequest;