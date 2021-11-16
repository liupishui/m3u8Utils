let m3u8Utils = require('../utils/m3u8/index')
let log = require('single-line-log').stdout;
let downloadNum = 0;
m3u8Utils.downloadM3u8('https://v4.cdtlas.com/20211113/20urU8bN/index.m3u8', 'D:\\m3u82', function (mediaData, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg, TsInfoKeyMethod, cryptoKey, cryptoIv) {
    downloadNum++;
    var str_next = '░', str_over = '█', total = 80;
    var str_over_length = parseInt(downloadNum / parseM3u8RstSegmentsOrg.length * 80);
    log((downloadNum / parseM3u8RstSegmentsOrg.length * 100).toFixed(2) + '% ' + str_over.repeat(str_over_length) + str_next.repeat(total - str_over_length) + ' ' + downloadNum + '/' + parseM3u8RstSegmentsOrg.length);
    if (downloadNum === parseM3u8RstSegmentsOrg.length) { //下载完成进行ts文件合并
        console.log('开始合并,请稍等')
        m3u8Utils.m3u8Convert(pathTarget, pathTarget + '/ss1.mp4').then(destPath => {
            console.log(destPath,'合并结束');
        });
    };
    return mediaData;
})
