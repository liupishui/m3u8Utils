let m3u8Utils = require('../utils/m3u8/index')
let log = require('single-line-log').stdout;
let downloadNum = 0;
//https://hd.ijycnd.com/play/vbmw00eY/index.m3u8
//https://play2.laoyacdn.com/20221022/D1toWGux/index.m3u8

m3u8Utils.downloadM3u8('https://play2.laoyacdn.com/20221022/D1toWGux/index.m3u8', 'D:\\m3u83', function (mediaData, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg, TsInfoKeyMethod, cryptoKey, cryptoIv) {
    downloadNum++;    
    var str_next = '░', str_over ='█' ,total = 80;
    var str_over_length = parseInt(downloadNum / parseM3u8RstSegmentsOrg.length * 80);
   // log((downloadNum / parseM3u8RstSegmentsOrg.length * 100).toFixed(2)+'%' + str_over.repeat(str_over_length) + str_next.repeat(80 - str_over_length) + downloadNum + '/' + parseM3u8RstSegmentsOrg.length);
   console.log('downloadNum',downloadNum); 
   return mediaData;
})




