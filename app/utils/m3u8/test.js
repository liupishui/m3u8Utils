function runTask(taskArr,processAsyncFun,maxRun){
    return new Promise((resolve,reject)=>{
        if (taskArr.length===0) {
            resolve('over');
            return;
        }
        let taskArrOrg = JSON.parse(JSON.stringify(taskArr));
        taskArr = taskArr.reverse();
        maxRun = Math.min.apply('',[maxRun,taskArr.length]);
        let count=0;
        let runTaskEach = async function(){
            if(taskArr.length > 0){
                taskCurr = taskArr.splice(-1)[0];
                try{
                    await processAsyncFun(taskCurr,taskArrOrg.length-taskArr.length-1,taskArrOrg);
                } catch(e) {    
                }
                if(taskArr.length===0){
                    count++;
                    if (count===maxRun) {
                        resolve('over')
                    }
                }else{
                    try{
                        await runTaskEach();
                    }catch(e){

                    }
                }
            }
        }
        for(let i=0;i<maxRun;i++){
            runTaskEach(taskArr);
        }
    
    })
}
runTask(['https://www.baidu.com','https://www.sogou.com','https://www.baidu.com','https://www.sogou.com','https://www.baidu.com','https://www.sogou.com','https://www.baidu.com','https://www.sogou.com','https://www.baidu.com','https://www.sogou.com','https://www.baidu.com','https://www.sogou.com','https://www.baidu.com','https://www.sogou.com','https://www.baidu.com','https://www.sogou.com','https://www.baidu.com','https://www.sogou.com'],async function(taskCurr,index,taskAll){
    try{
        await fetch(taskCurr);
    }catch(e){
    }finally{
    }
    return true
},2).then(data=>console.log(data)).catch(e=>{console.log(e)});