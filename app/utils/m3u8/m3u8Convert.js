// https://www.cnblogs.com/muamaker/p/11589410.html
let path = require('path');
let fs = require('fs');
let child_process = require('child_process');

//D:\web\m3u8\m3u8\bin/ffmpeg -y -f concat -safe 0 -i D:\m3u8\input.txt -acodec copy -vcodec copy -absf  aac_adtstoasc output.mp4
async function m3u8Convert(inputFilePath,targetFilePath){
    inputFilePath = fs.statSync(inputFilePath).isFile() ? inputFilePath : inputFilePath + '/input.txt';
    var convert = function(){ 
                    return new Promise(function(resolve,reject){
                        child_process.exec(path.resolve(__dirname, '../../../bin') + '/ffmpeg -y -f concat -safe 0 -i ' + inputFilePath + ' -acodec copy -vcodec copy -absf aac_adtstoasc ' + targetFilePath, function (err, success) {
                            resolve(err ? false : targetFilePath);
                        });
                    })
                };
    let rst = await convert();
    return rst;
}

module.exports = m3u8Convert;