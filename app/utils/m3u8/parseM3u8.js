let got = require('got');
let m3u8Parser = require('m3u8-parser');
let urlParse = require('url');
let path = require('path');
let fs = require('fs-extra');
let URL = require('url');
async function parseM3u8(url) {
    try {
        let data = '';
        if (url.indexOf('http') !== 0) {
            data = fs.readFileSync(url, 'utf-8');
        } else {
            let dataHtpp = await got(url, { timeout: 10 * 1000 });
            data = dataHtpp.body;
        }
        let parser = new m3u8Parser.Parser();
        parser.push(data);
        parser.end();
        let rst = {
            segments: [],//所有.ts文件
            newM3u8Data: '',//新的m3u8文件
            oldM3u8Data: data//旧的m3u8文件
        }
        if (parser.manifest.playlists && parser.manifest.playlists.length > 0) {
            url = urlParse.resolve(url, parser.manifest.playlists[0].uri)
            let dataSource = await got(url);
            rst.oldM3u8Data = dataSource.body;
            parser = new m3u8Parser.Parser();
            parser.push(dataSource.body);
            parser.end();
        }
        if (url.indexOf('http') !== -1) {
            rst.oldM3u8Data = rst.oldM3u8Data.replace(/,\s+(.*.ts)/igm, function (val, val1) { return val.indexOf('http') !== -1 ? val : (',\n' + URL.resolve(url, val1)); });
        }
        rst.newM3u8Data = rst.oldM3u8Data.replace(/,\s+.*.ts/igm, function (val) { return val.indexOf('http') !== -1 ? (',\n' + path.parse(val).base) : val; });
        rst.newM3u8Data = rst.newM3u8Data.replace(/,\s+.*/igm, function (val) { let rst = val; if (val.indexOf('/') !== -1) { rst = ',\n' + val.substr(val.lastIndexOf('/')) }; return rst; });
        rst.newM3u8Data = rst.newM3u8Data.replace(/#EXT-X-KEY.*\s+#/igm, '#');
        rst.segments = parser.manifest.segments;
        rst.segments.forEach((val, key) => {
            if (val.uri.indexOf('http') !== 0) {
                val.uri = urlParse.resolve(url, val.uri);
            }
            if (val.key && val.key.uri && val.key.uri.indexOf('http') !== 0) {
                if(url.indexOf('http')===0){
                    val.key.uri = urlParse.resolve(url, val.key.uri);
                }else{
                    val.key.uri = urlParse.resolve(val.uri, val.key.uri);
                }
            }
        });
        return rst;
    } catch (e) {
        return false;
    }
}
module.exports = parseM3u8;