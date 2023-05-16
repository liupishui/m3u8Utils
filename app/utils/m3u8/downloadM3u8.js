//下载输入m3u8网络地址，和存储位置；下载对应.m3u8文件和.ts文件到指定文件夹内，同时在指定文件夹内生成input.txt文件用于使用ffmpeg.exe工具.ts文件合并生成.mp4文件
let parseM3u8 = require('./parseM3u8');
let got = require('got');
let fs = require('fs');
let path = require('path');
let urlParse = require('url');
let crypto = require('crypto');
const { resolve } = require('path');
let undiciRequest = require('./undiciRequest');
const { isBuffer } = require('util');
let cryptoKey = {};
const url = require('url');
function isUtf8(buffer) {
    let i = 0;
    while (i < buffer.length) {
      if ((buffer[i] & 0b10000000) === 0b00000000) {
        i++;
      } else if ((buffer[i] & 0b11100000) === 0b11000000) {
        if ((buffer[i + 1] & 0b11000000) !== 0b10000000) {
          return false;
        }
        i += 2;
      } else if ((buffer[i] & 0b11110000) === 0b11100000) {
        if ((buffer[i + 1] & 0b11000000) !== 0b10000000 ||
            (buffer[i + 2] & 0b11000000) !== 0b10000000) {
          return false;
        }
        i += 3;
      } else if ((buffer[i] & 0b11111000) === 0b11110000) {
        if ((buffer[i + 1] & 0b11000000) !== 0b10000000 ||
            (buffer[i + 2] & 0b11000000) !== 0b10000000 ||
            (buffer[i + 3] & 0b11000000) !== 0b10000000) {
          return false;
        }
        i += 4;
      } else {
        return false;
      }
    }
    return true;
  }
  
//http://www.flashme.cn/index.php/web/50.html
function getiv(segmentNumber) {
    const uint8View = new Uint8Array(16);

    for (let i = 12; i < 16; i++) {
        uint8View[i] = (segmentNumber >> (8 * (15 - i))) & 0xff;
    }

    return uint8View;
}
async function downloadTs(TsInfo, pathTarget, processFun, segmentsOrder, parseM3u8RstSegmentsOrg,TsDownloadedProgress,headerOptions) {
    var pathTargetFull = pathTarget + TsInfo.uri.substr(TsInfo.uri.lastIndexOf('/')).split('?')[0];
    if (fs.existsSync(pathTargetFull)) {
        if(fs.readFileSync(pathTargetFull).length===0){
            fs.unlinkSync(pathTargetFull);
            processFun({error:{message:'数据为空',code:'CONTENTEMPTY'}}, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg);
        }else{
            processFun(fs.readFileSync(pathTargetFull), TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg);
            TsDownloadedProgress(fs.readFileSync(pathTargetFull), TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg);
            return true;
        }
    }
    let processFunctionIsRun = false;
    if (TsInfo.key) {
        if (TsInfo.key.method) {
            try{
                if (typeof (cryptoKey['TsInfo.key.uri']) === 'undefined') {
                    // fetch('https://vo1.123188kk.com/20211103/kiRfauFR/hls/key.key',{ method:'get', responseType:'arraybuffer'}).then(res=>{
                    //     console.log('%O',res);
                    //     return res.arrayBuffer()
                    // }).then(data=>{new Uint8Array(data)})
                    // console.log(TsInfo.key.uri);
                    let urlKeyObject = url.parse(TsInfo.key.uri);
                    let defaultKeyHeaderOption = {
                        "user-agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.5359.95 Safari/537.36",
                        "Referer":TsInfo.key.uri,
                        "Origin":TsInfo.key.uri,
                        "Host":urlKeyObject.host,
                    }
                    if(headerOptions && headerOptions.keyHeaders){
                        Object.assign(defaultKeyHeaderOption,headerOptions.keyHeaders);
                    }
                    let keyDataGet = await undiciRequest(TsInfo.key.uri,{ headers: defaultKeyHeaderOption});
                    // console.log(keyDataGet.data);
                    if(keyDataGet && keyDataGet.data){
                        if(isUtf8(keyDataGet.data)){
                            keyDataGet = keyDataGet.data.toString();
                            cryptoKey[TsInfo.key.uri] = new Uint8Array(Buffer.from(keyDataGet.replace(/\s+/, '')));
                        }else{
                            cryptoKey[TsInfo.key.uri] = new Uint8Array(Buffer.from(keyDataGet.data));
                        }
                    }
                    //console.log(keyDataGet);
                    //console.log(Buffer.from(keyDataGet.replace(/\s+/, ''),'base64'));
                    //console.log(Buffer.from(cryptoKey[TsInfo.key.uri],'utf-8'));
                }
                let defaultTsHeaderOption = {
                }
                if(headerOptions && headerOptions.TsHeaders){
                    Object.assign(defaultTsHeaderOption,headerOptions.TsHeaders);
                }
                let res = await undiciRequest(TsInfo.uri,{ headers: defaultTsHeaderOption});
                // https://github.com/video-dev/hls.js/blob/b34e8b82daa3c26efd009f1e5af085c34ea0a678/src/loader/fragment.ts#L220
                //console.log(cryptoKey[TsInfo.key.uri]);
                // console.log(TsInfo.key);
                // console.log(TsInfo.key.iv.buffer);
                let cryptoIv = '';
                if(TsInfo.key.iv){
                    if(TsInfo.key.iv.buffer){
                        // console.log(Buffer.from(TsInfo.key.iv.buffer));
                        cryptoIv = new Uint8Array(TsInfo.key.iv.buffer);
                    }else{
                        cryptoIv = new Uint8Array(Buffer.from(TsInfo.key.iv));
                    }
                }else{
                    cryptoIv = getiv(segmentsOrder - 1);
                }
                let processRst = '';
                if (res && res.data && res.data.length>0){
                   // downloadCount++;
                   // console.log('downloadCount',downloadCount)
                   processFunctionIsRun = true;
                    processRst = processFun(res.data, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg, TsInfo.key.method, cryptoKey[TsInfo.key.uri], cryptoIv);
                    if (processRst.cryptoIv) {
                        cryptoIv = processRst.cryptoIv;
                    };
                    if (processRst.cryptoKey) {
                        cryptoKey[TsInfo.key.uri] = processRst.cryptoKey;
                    }
                    if (processRst.cryptoMethod) {
                        TsInfo.key.method = processRst.cryptoMethod;
                    }
                    if (processRst.isDecrypto){//如果已经解密直接写入
                        fs.writeFileSync(pathTargetFull, processRst.data);
                        TsDownloadedProgress(decRst, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg, TsInfo.key.method, cryptoKey[TsInfo.key.uri], cryptoIv);
                    }else{
                        let decipher = crypto.createDecipheriv((TsInfo.key.method + '-cbc').toLocaleLowerCase(), cryptoKey[TsInfo.key.uri], cryptoIv);
                        decRst = Buffer.concat([decipher.update(Buffer.isBuffer(processRst) ? processRst : processRst.data), decipher.final()]);
                        if(decRst.length>0){
                            fs.writeFileSync(pathTargetFull, decRst);
                            TsDownloadedProgress(decRst, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg, TsInfo.key.method, cryptoKey[TsInfo.key.uri], cryptoIv);
                        }else{
                            TsDownloadedProgress({ error: { message: '数据为空', code: 'CONTENTEMPTY' } }, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg, TsInfo.key.method, cryptoKey[TsInfo.key.uri], cryptoIv);
                        }
                    }

                }else{
                    //downloadCount1++;
                    //console.log('downloadCount1',downloadCount1)
                    processFunctionIsRun = true;
                    processRst = processFun({ error: { message: '数据为空', code: 'CONTENTEMPTY' } }, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg, TsInfo.key.method, cryptoKey[TsInfo.key.uri], cryptoIv);
                    TsDownloadedProgress({ error: { message: '数据为空', code: 'CONTENTEMPTY' } }, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg, TsInfo.key.method, cryptoKey[TsInfo.key.uri], cryptoIv);
                }
                return true;
            }catch(e){
                //downloadCount2++;
                //console.log('downloadCount2',downloadCount2)
                if(processFunctionIsRun===false){
                    processFun({error:e}, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg, TsInfo.key.method, cryptoKey[TsInfo.key.uri], '');
                    TsDownloadedProgress({error:e}, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg, TsInfo.key.method, cryptoKey[TsInfo.key.uri], '');
                }else{
                    //console.log(e);
                }
                return Promise.reject(e);
            }
        }
    } else {
        try{
            let res = await undiciRequest(TsInfo.uri);
            if(res && res.data && res.data.length>0){
                processFunctionIsRun = true;
                if(segmentsOrder==0){
                    console.log(2);
                }
                let data = processFun(res.data, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg);
                fs.writeFileSync(pathTargetFull, data);
                TsDownloadedProgress(res.data, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg);
            }else{
                processFunctionIsRun = true;
                processFun({ error: { message: '数据为空', code: 'CONTENTEMPTY' } }, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg);
                TsDownloadedProgress({ error: { message: '数据为空', code: 'CONTENTEMPTY' } }, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg);
            }
        }catch(e){
            if(processFunctionIsRun===false){
                processFun({error:e}, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg)
                TsDownloadedProgress({error:e}, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg);
            }
            return Promise.reject(e);
        }
    }
    return true;
}


async function downloadM3u8(url, pathTarget, progressOrg,TsDownloadedProgressOrg,headerOptions) {
    // pathTarget存储的目的地址
    let progress = function (bufferData) { return bufferData };
    let TsDownloadedProgress = function(){};
    if (progressOrg) {
        progress = progressOrg;
    }
    if(TsDownloadedProgressOrg){
        TsDownloadedProgress = TsDownloadedProgressOrg;
    }
    if (!fs.existsSync(pathTarget)) {
        fs.mkdirSync(pathTarget, { recursive: true });
    }
    let parseM3u8Rst = await parseM3u8(url); //获取所有ts片段
    let inputTxt = 'ffconcat version 1.0\n';//ffmpeg生成mp4所用文件
    if(typeof(parseM3u8Rst.segments)=='undefined'){
        return;
    };
    for (let i = 0; i < parseM3u8Rst.segments.length; i++) {
        inputTxt += 'file ' + pathTarget.replace('\\', '//') + '//' + path.parse(parseM3u8Rst.segments[i].uri).base.split("?")[0] + '\n';
    }
    fs.writeFileSync(pathTarget + '/input.txt', inputTxt);
    fs.writeFileSync(pathTarget + '/index_new.m3u8', parseM3u8Rst.newM3u8Data);
    fs.writeFileSync(pathTarget + '/index.m3u8', parseM3u8Rst.oldM3u8Data);
    // let parseM3u8RstSegmentsOrg = JSON.parse(JSON.stringify(parseM3u8Rst.segments));
    let segmentsPath = fs.readdirSync(pathTarget, { withFileTypes:true });
    //先将已经下载过的去掉
    let segmentsPathObj = {};
    segmentsPath.forEach((val,key)=>{
        segmentsPathObj[val.name] = key+1;
    });
    // for (let j = parseM3u8Rst.segments.length-1; j>-1; j--){
    //     segmentsPath.forEach((val,key)=>{
    //         // console.log(j,parseM3u8Rst.segments[j]);
    //         if(parseM3u8Rst.segments[j]){
    //             if (parseM3u8Rst.segments[j].uri.substr(parseM3u8Rst.segments[j].uri.lastIndexOf('/')+1).split('?')[0]===val.name) {
    //                 let TsInfo = parseM3u8Rst.segments.splice(j, 1)[0];
    //                 console.log('162parseM3u8RstSegmentsOrg',parseM3u8RstSegmentsOrg.length);
    //                 progress(true, TsInfo, pathTarget, j, parseM3u8RstSegmentsOrg);
    //             }
    //         }
    //     })
    // }
    //run task 里过滤已经下载过的ts
    async function runTask(taskArr, processAsyncFun, maxRun) {
        const taskArrOrg = [...taskArr];
        const runningTasks = new Set();
        const completeTasks = new Set();
        const progress = new Array(taskArr.length).fill(false);
      
        async function run() {
          while (runningTasks.size < maxRun && taskArr.length > 0) {
            const taskIndex = taskArrOrg.length - taskArr.length;
            const task = taskArr.shift();
            runningTasks.add(task);
            [1].forEach(async()=>{
                try {
                    await processAsyncFun(task, taskIndex, taskArrOrg);
                    progress[taskIndex] = true;
                  } catch (e) {
                    console.error(e);
                  }
                  completeTasks.add(task);
                  runningTasks.delete(task);
            })
          }
      
          if (completeTasks.size === taskArrOrg.length) {
            return Promise.resolve([taskArrOrg,progress]);
          }
      
          await new Promise((resolve) => setTimeout(resolve, 100));
          await run();
        }
      
        let rst = await run();
        return rst;
      }
    //console.log(parseM3u8Rst.segments);
    let runrst = await runTask(parseM3u8Rst.segments,async function(taskCurr,index,taskAll){
        //console.log('index,taskAll.length',index,taskAll.length);
        if(segmentsPathObj[taskCurr.uri.substr(taskCurr.uri.lastIndexOf('/')+1).split('?')[0]]){
            //已经下载过的不重复下载
            progress(true, taskCurr, pathTarget, index, taskAll);
            TsDownloadedProgress(true, taskCurr, pathTarget, index, taskAll);
        }else{
            try{
                await downloadTs(taskCurr, pathTarget, progress, index, taskAll,TsDownloadedProgress,headerOptions);
            }catch(e){
                //console.log(e);
            }
        }
        return true;
    },100);
    return runrst;
    // let downloadTsStep = 20;//每X个Ts文件一组下载,调试的时候改为1
    // for(let i=0;i<Math.ceil(parseM3u8Rst.segments.length/downloadTsStep);i++){
    //     let PromiseArr = [];
    //     for(let j=0;j<downloadTsStep;j++){
    //         PromiseArr.push(new Promise(async (resolve,reject)=>{
    //             if(parseM3u8Rst.segments[i*downloadTsStep+j]){
    //                 let Err = null;
    //                 try{
    //                     await downloadTs(parseM3u8Rst.segments[i*downloadTsStep+j], pathTarget, progress, i*downloadTsStep+j, parseM3u8RstSegmentsOrg);
    //                 }catch(e){
    //                     Err = e;
    //                 }
    //                 if(Err){
    //                     reject(Err);
    //                 }else{
    //                     resolve(true);
    //                 }
    //             }
    //         }));
    //     }
    //     try{
    //         await Promise.all(PromiseArr);
    //     }catch(e){
    //         // if(e.statusCode&&e.statusCode!=200){
    //         //     //如果是http状态码错误(如果424，500，等等),则不继续执行
    //         //     return;
    //         // }
    //     }
    // }
    // let promiseFunction = function () {
    //     return new Promise(async (resolve, reject) => {
    //         let loopNumber = parseM3u8Rst.segments.length;
    //         for (let i = 0; i < loopNumber; i++) {
    //             if (parseM3u8Rst.segments.length !== 0) {
    //                 let segmentsOrder = parseM3u8Rst.segments.length;
    //                 // let rst = await downloadTs(parseM3u8Rst.segments.splice(-1)[0], pathTarget, progress, segmentsOrder, parseM3u8RstSegmentsOrg);
    //                 await downloadTs(parseM3u8Rst.segments.splice(-1)[0], pathTarget, progress, segmentsOrder, parseM3u8RstSegmentsOrg);
    //             }
    //         }
    //         resolve(true);
    //     })
    // }
    // for (let i = 0; i < 15; i++) { //同时下载15个
    //     promiseFunction();
    // }
}
module.exports = downloadM3u8;
