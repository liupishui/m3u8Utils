# m3u8Utils

实现m3u8视频源的下载和合并。

支持aes-128-cbc简单加密的ts文件自动解密下载和手动配置加密方法，key，iv;

支持文件缓存，断点续传。

方便对接电影资源站，进行批量下载。

### 安装

```
    npm install m3u8utils
```

### 使用
```
    let m3u8Utils = require('m3u8utils');
```

### 工具有三个接口

###### 1.parseM3u8

参数：

url string

返回：

segments 所有.ts文件描述数组

newM3u8Data:'',//新的m3u8文件

oldM3u8Data:data.body//旧的m3u8文件
         
例子：

```javascript
    let m3u8Utils = require('m3u8utils');
    m3u8Utils.parseM3u8('https://v4.cdtlas.com/20211113/20urU8bN/index.m3u8').then((data)=>{
        console.log(data);
    })
```
###### 2.downloadM3u8

参数：

url   string m3u8网络地址
     
pathTarget string 下载存储目录,调用结束后目录文件夹下会生成input.txt(用于ts文件合并),相对路径的index.m3u8

progress   function 下载过程中处理下载数据

例子：

```javascript
let m3u8Utils = require('m3u8utils');
let log = require('single-line-log').stdout;
let downloadNum = 0;
m3u8Utils.downloadM3u8('https://v4.cdtlas.com/20211113/20urU8bN/index.m3u8', 'D:\\m3u81', 
    function (mediaData, // 当前Ts的Buffer
    TsInfo,          //当前Ts文件相关信息
    pathTarget,      //文件要存放目录
    segmentOrder,    //当前Ts文件在Segments数组中的位置-1
    segments,        //Segments列表(描述Ts文件信息的列表)
    TsInfoKeyMethod, //加密方法 例如aes-128，ts文件没有加密为值undefined
    cryptoKey,       //加密对应的key值，ts文件没有加密为值undefined
    cryptoIv         //加密偏移量iv，ts文件没有加密为值undefined
    ) {
    downloadNum++;    
    var str_next = '░', str_over ='█' ,total = 80;
    var str_over_length = parseInt(downloadNum / segments.length * 80);
    log((downloadNum / segments.length * 100).toFixed(2)+'%' + str_over.repeat(str_over_length) + str_next.repeat(80 - str_over_length) + downloadNum + '/' + segments.length);
    return mediaData;//返回处理后的数据
    // return { //返回
    //     data:mediaData,
    //     cryptoMethod:'aes-128-cbc',
    //     cryptoKey:'key',
    //     cryptoIv:'iv',
    //     isDecrypto:false //默认未解密
    // }
})
```
###### 3.m3u8convert

使用ffmpeg将ts片段合并成.mp4文件

参数：

inputFilePath 存放所有ts文件位置的input.txt文件或者文件夹

targetFilePath 合并后的mp4要存放到的完整路径

```javascript
let m3u8Utils = require('m3u8utils');
m3u8Utils.m3u8Convert('D:\\m3u81\\input.txt','d:\\m3u81/ss1.mp4').then(destPath=>{
    console.log(destPath)
});
```

### 一个综合的例子

```javascript
let m3u8Utils = require('m3u8utils')
let log = require('single-line-log').stdout;
let downloadNum = 0;
m3u8Utils.downloadM3u8('https://v4.cdtlas.com/20211113/20urU8bN/index.m3u8', 'D:\\m3u82', function (mediaData, TsInfo, pathTarget, segmentsOrder, parseM3u8RstSegmentsOrg, TsInfoKeyMethod, cryptoKey, cryptoIv) {
    downloadNum++;
    var str_next = '░', str_over = '█', total = 80;
    var str_over_length = parseInt(downloadNum / parseM3u8RstSegmentsOrg.length * 80);
    log((downloadNum / parseM3u8RstSegmentsOrg.length * 100).toFixed(2) + '% ' + str_over.repeat(str_over_length) + str_next.repeat(total - str_over_length) + ' ' + downloadNum + '/' + parseM3u8RstSegmentsOrg.length);
    if (downloadNum === parseM3u8RstSegmentsOrg.length) { //下载完成进行ts文件合并
        console.log('开始合并，请稍等')
        m3u8Utils.m3u8Convert(pathTarget, pathTarget + '/ss1.mp4').then(destPath => {
            console.log(destPath,'合并结束');
        });
    };
    return mediaData;
})

```


