let m3u8Utils = require('../utils/m3u8/index')
let log = require('single-line-log').stdout;
let downloadNum = 0;
m3u8Utils.downloadM3u8('https://v4.cdtlas.com/20211113/20urU8bN/index.m3u8', 'D:\\m3u81', function (mediaData, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg, TsInfoKeyMethod, cryptoKey, cryptoIv) {
    downloadNum++;    
    var str_next = '░', str_over ='█' ,total = 80;
    var str_over_length = parseInt(downloadNum / parseM3u8RstSegmentsOrg.length * 80);
    log((downloadNum / parseM3u8RstSegmentsOrg.length * 100).toFixed(2)+'%' + str_over.repeat(str_over_length) + str_next.repeat(80 - str_over_length) + downloadNum + '/' + parseM3u8RstSegmentsOrg.length);
    return mediaData;
})




