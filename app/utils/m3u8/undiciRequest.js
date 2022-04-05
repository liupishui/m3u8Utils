let undici = require('undici');
let undiciRequest = function(url,options){
    let optionsDefault={
        retry:3,//重试次数
        bodyTimeout:10000,
        headersTimeout:10000,
        maxRedirections:3//最大跳转次数,如301
    };
    if(options){
        Object.assign(optionsDefault,options);
    }
    return new Promise((resolve,reject)=>{
        let retryInner = 0;
        let undiciRequestInner = function(url,optionsDefault){
                undici.request(url,optionsDefault).then(async (response)=>{
                    if(response.statusCode!==200 && retryInner<optionsDefault.retry){
                        retryInner++;
                        undiciRequestInner(url);
                    } else if(response.statusCode===200){
                        let dataAll = [];
                        for await (const data of response.body) {
                            dataAll.push(data);
                        }
                        let BufferDataAll = Buffer.concat(dataAll);
                        resolve({data:BufferDataAll,url:response.context.history[response.context.history.length-1].href});
                    }else{
                        reject(false);
                    }
                }).catch(e=>{
                    let b=e;
                    console.log(b);
                    if(retryInner<optionsDefault.retry){
                        retryInner++;
                        undiciRequestInner(url,optionsDefault);
                    }else{
                        reject(false);
                    }
                });
        }
        undiciRequestInner(url,optionsDefault);
    });
}
module.exports = undiciRequest;