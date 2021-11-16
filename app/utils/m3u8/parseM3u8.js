let got = require('got');
let m3u8Parser = require('m3u8-parser');
let urlParse = require('url');
let path = require('path');
async function parseM3u8(url){
    let data = await got(url);
    let parser = new m3u8Parser.Parser();
    parser.push(data.body);
    parser.end();
    let rst = {
        segments:[],//所有.ts文件
        newM3u8Data:'',//新的m3u8文件
        oldM3u8Data:data.body//旧的m3u8文件
    }
    if (parser.manifest.playlists && parser.manifest.playlists.length>0){
        url = urlParse.resolve(url, parser.manifest.playlists[0].uri)
        let dataSource = await got(url);
        rst.oldM3u8Data = dataSource.body;
        parser = new m3u8Parser.Parser();
        parser.push(dataSource.body);
        parser.end();
    }
    rst.newM3u8Data = rst.oldM3u8Data.replace(/,\s+.*.ts/igm, function (val) { return ',\n' + path.parse(val).base; });
    rst.segments = parser.manifest.segments;
    rst.segments.forEach((val,key)=>{
        if(val.uri.indexOf('http')!==0){
            val.uri = urlParse.resolve(url, val.uri);
        }
        if(val.key&&val.key.uri&&val.key.uri.indexOf('http')!==0){
            val.key.uri = urlParse.resolve(url, val.key.uri);
        }
    });
    return rst;
}
module.exports = parseM3u8;