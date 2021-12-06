//下载输入m3u8网络地址，和存储位置；下载对应.m3u8文件和.ts文件到指定文件夹内，同时在指定文件夹内生成input.txt文件用于使用ffmpeg.exe工具.ts文件合并生成.mp4文件
let parseM3u8 = require('./parseM3u8');
let got = require('got');
let fs = require('fs');
let path = require('path');
let urlParse = require('url');
let crypto = require('crypto');
const { resolve } = require('path');
let cryptoKey = {};
//http://www.flashme.cn/index.php/web/50.html
function getiv(segmentNumber) {
    const uint8View = new Uint8Array(16);

    for (let i = 12; i < 16; i++) {
        uint8View[i] = (segmentNumber >> (8 * (15 - i))) & 0xff;
    }

    return uint8View;
}
async function downloadTs(TsInfo, pathTarget, process, segmentsOrder, parseM3u8RstSegmentsOrg) {
    var pathTargetFull = pathTarget + TsInfo.uri.substr(TsInfo.uri.lastIndexOf('/'));
    if (fs.existsSync(pathTargetFull)) {
        if(fs.readFileSync(pathTargetFull).length===0){
            fs.unlinkSync(pathTargetFull);
            process({error:{message:'数据为空',code:'CONTENTEMPTY'}}, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg);
        }else{
            process(fs.readFileSync(pathTargetFull), TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg);
        }
        return true;
    }
    if (TsInfo.key) {
        if (TsInfo.key.method) {
            try{
                if (typeof (cryptoKey['TsInfo.key.uri']) === 'undefined') {
                    // fetch('https://vo1.123188kk.com/20211103/kiRfauFR/hls/key.key',{ method:'get', responseType:'arraybuffer'}).then(res=>{
                    //     console.log('%O',res);
                    //     return res.arrayBuffer()
                    // }).then(data=>{new Uint8Array(data)})
                    let keyDataGet = await got(TsInfo.key.uri,{timeout:10*1000,retry:3});
                    //console.log(keyDataGet);
                    cryptoKey[TsInfo.key.uri] = new Uint8Array(Buffer.from(keyDataGet.body.replace(/\s+/, '')));
                    //console.log(Buffer.from(cryptoKey[TsInfo.key.uri],'utf-8'));
                }
                let tsData = await got(TsInfo.uri,{timeout:3*1000,retry:5});
                // https://github.com/video-dev/hls.js/blob/b34e8b82daa3c26efd009f1e5af085c34ea0a678/src/loader/fragment.ts#L220
                //console.log(cryptoKey[TsInfo.key.uri]);
                let cryptoIv = TsInfo.key.iv ? new Uint8Array(Buffer.from(TsInfo.key.iv)) : getiv(segmentsOrder - 1);
                var processRst = process(tsData.rawBody, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg, TsInfo.key.method, cryptoKey[TsInfo.key.uri], cryptoIv);
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
                }else{
                    let decipher = crypto.createDecipheriv((TsInfo.key.method + '-cbc').toLocaleLowerCase(), cryptoKey[TsInfo.key.uri], cryptoIv);
                    decRst = Buffer.concat([decipher.update(Buffer.isBuffer(processRst) ? processRst : processRst.data), decipher.final()]);
                    fs.writeFileSync(pathTargetFull, decRst);
                }
                return true;
            }catch(e){
                process({error:e}, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg, TsInfo.key.method, cryptoKey[TsInfo.key.uri], cryptoIv);
                return true;
            }
        }
    } else {
        try{
            let data = await got(TsInfo.uri,{timeout:10*1000,retry:3})
            fs.writeFileSync(pathTargetFull, process(data.rawBody, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg));
        }catch(e){
            process({error:e}, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg)
            return true;
        }
    }
    return true;
}


async function downloadM3u8(url, pathTarget, progressOrg) {
    // pathTarget存储的目的地址
    let progress = function (bufferData) { return bufferData };
    if (progressOrg) {
        progress = progressOrg;
    }
    if (!fs.existsSync(pathTarget)) {
        fs.mkdirSync(pathTarget, { recursive: true });
    }
    let parseM3u8Rst = await parseM3u8(url); //获取所有ts片段
    let inputTxt = 'ffconcat version 1.0\n';//ffmpeg生成mp4所用文件
    for (let i = 0; i < parseM3u8Rst.segments.length; i++) {
        inputTxt += 'file ' + pathTarget.replace('\\', '//') + '//' + path.parse(parseM3u8Rst.segments[i].uri).base + '\n';
    }
    fs.writeFileSync(pathTarget + '/input.txt', inputTxt);
    fs.writeFileSync(pathTarget + '/index_new.m3u8', parseM3u8Rst.newM3u8Data);
    fs.writeFileSync(pathTarget + '/index.m3u8', parseM3u8Rst.oldM3u8Data);
    let parseM3u8RstSegmentsOrg = JSON.parse(JSON.stringify(parseM3u8Rst.segments));
    let promiseFunction = function () {
        return new Promise(async (resolve, reject) => {
            let loopNumber = parseM3u8Rst.segments.length;
            for (let i = 0; i < loopNumber; i++) {
                if (parseM3u8Rst.segments.length !== 0) {
                    let segmentsOrder = parseM3u8Rst.segments.length;
                    // let rst = await downloadTs(parseM3u8Rst.segments.splice(-1)[0], pathTarget, progress, segmentsOrder, parseM3u8RstSegmentsOrg);
                    await downloadTs(parseM3u8Rst.segments.splice(-1)[0], pathTarget, progress, segmentsOrder, parseM3u8RstSegmentsOrg);
                }
            }
            resolve(true);
        })
    }
    for (let i = 0; i < 15; i++) { //同时下载15个
        promiseFunction();
    }
}
module.exports = downloadM3u8;