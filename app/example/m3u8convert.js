let m3u8Utils = require('../utils/m3u8/index')
m3u8Utils.m3u8Convert('D:\\m3u81\\input.txt','d:\\m3u81/ss1.mp4').then(destPath=>{
    console.log(destPath)
});
