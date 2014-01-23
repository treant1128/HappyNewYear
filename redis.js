var redis = require('redis');
var async = require('async');
client = redis.createClient(6379, 'localhost', null);
//chunjie选用db13
client.select(13);

var getTodayDate = function(){
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth()  < 9 ? '0' + (now.getMonth() + 1) : now.getMonth() + 1;
    var day = now.getDate() < 10 ? '0' + now.getDate() : now.getDate();
    return year + '-' + month + '-' + day;
};

var HASH_ALLDAYS        = 'Hash_AllDays';

var UV_SET_ACCESS       = 'UV:Set_Access';
var UV_SET_JUMP         = 'UV:Set_Jump';
var UV_SET_CLICK        = 'UV:Set_Click';

var PV_HASH_ACCESS      = 'PV:Hash_Access';
var PV_HASH_NONUMBER    = 'PV:Hash_NoNumber';
var PV_HASH_JUMP        = 'PV:Hash_Jump';
var PV_HASH_CLICK       = 'PV:Hash_Click';

//虽然成功订购量 和 成功赠送 不是想要统计PV  但本质上也是单纯的HINCRBY 1  所以姑且当做是PV的逻辑
var PV_HASH_ORDER_OK    = 'PV:Hash_Order_OK:';
var PV_HASH_PRESENT_OK     = 'PV:Hash_Present_OK:';  

var SET_FREE10M_MISSION = 'Set_Free10M_Mission';
var SET_FREE10M_SUCCESS = 'Set_Free10M_Success';

var HASH_ALL_PRESENTS   = 'Hash_All_Presents';

//根据周期性的查询到用户在Oracle中的chunjie status=1的订单个数
exports.refreshSuccessOrderCount = function(phoneNumber, successCount, cb){
    if(phoneNumber.constructor === String && successCount.constructor === Number){
        client.HSET(HASH_ALL_PRESENTS, 'T:' + phoneNumber, successCount, function(err, result){     //Total chunjie Success Order Count
            if(err) throw err;
            cb(result);
        });    
    }    
};

//获取某个号码已经成功赠送了多少次10M
exports.getPresentsAlready  = function(phoneNumber, cb){
    if(phoneNumber.constructor === String){
        client.HGET(HASH_ALL_PRESENTS, 'P:' + phoneNumber, function(err, result){
            if(err) throw err;
            if(result == null){
                result = 0;    
            }
            cb(result);
        });    
    }
};

//给某个号码已成功赠送的数量+1
exports.incrPresentsAlready = function(phoneNumber, incr, cb){
    if(phoneNumber.constructor === String && incr.constructor === Number){
        client.HINCRBY(HASH_ALL_PRESENTS, 'P:' + phoneNumber, incr, function(err, rr){
            if(err) throw err;
            cb(rr);
        });    
    }    
};

//赠送成功后就从Mission move到Success
exports.move10MMissionToSuccess = function(mem, cb){
    if(mem.constructor === String){
        client.SMOVE(SET_FREE10M_MISSION, SET_FREE10M_SUCCESS, mem, function(err, result){
            if(err) throw err;
            cb(result);
        });    
    }    
};

//订购成功的要赠送10M流量的
exports.addToFree10MMission = function(mem, cb){
    if(mem.constructor === String){
        client.SADD(SET_FREE10M_MISSION, mem, function(err, result){
            if(err) throw err;
            cb(result);
        });    
    } 
};

//获取不到手机号的用户点击订购后, 不用再次确认套餐类型 根据"x-real-ip和user-agent生成secret
exports.verifyTTL = function(key, cb){
    client.GET(key, function(err, result){
        if(err) throw err;
        cb(result);    
    });    
};

//client.SET('name', 'Panda', 'EX', 30, function(err, result){
//    console.log(result);
//});

// Starting with Redis 2.6.12 SET supports a set of options that modify its behavior:
// EX seconds -- Set the specified expire time, in seconds.
// PX milliseconds -- Set the specified expire time, in milliseconds.
// NX -- Only set the key if it does not already exist.
// XX -- Only set the key if it already exist.

exports.setTTL = function(key, value, expire, cb){
    client.SET(key, value, 'EX', expire, function(err, result){
        cb(result);    
    });    
};
function addToPV(fieldPrefix){
    if(fieldPrefix.constructor === String){
        client.HINCRBY(HASH_ALLDAYS, fieldPrefix + ':' + getTodayDate(), 1);
    }
};
//总共一个Hash, key为Hash_AllDays, 每天多出一个field -> PV + 日期 
//每日访问的PV
exports.accessPV = function(){
    addToPV(PV_HASH_ACCESS);
};

//获取不到手机号码的PV
exports.noNumberPV = function(){
    addToPV(PV_HASH_NONUMBER);
};

//跳出的PV
exports.jumpPV = function(){
    addToPV(PV_HASH_JUMP);    
};

//点击type的PV
exports.clickPV = function(type){
    addToPV(PV_HASH_CLICK + type);
};

//成功订购
exports.orderOK = function(type){
    addToPV(PV_HASH_ORDER_OK + type);
};

//成功赠送10M流量
exports.present10MOK = function(type){
    addToPV(PV_HASH_PRESENT_OK + type);
};


//**********************************************************************//

//每日产生一个Set, 为了统计方便把SADD的结果HINCRBY给Hash  其实可以迭代HGETALL得到的fields去SCARD  Set
function addToUV(fieldPrefix, phoneNumber){
    if(fieldPrefix.constructor === String && phoneNumber.constructor === String){
        var today = getTodayDate();
        async.waterfall([
            function(cb){
                client.SADD(fieldPrefix.substr(3) + today, phoneNumber, function(err, result){      //UV:Set_Access: -> Set_Access:  去掉前面的'UV:'
                    cb(err, result);  //return the number of elements that were added to the set, not including all the already present.
                });
            },

            function(incr, cb){
                client.HINCRBY(HASH_ALLDAYS, fieldPrefix + ':' + today, incr, function(err, result){
                    cb(err, result);
                });
            }
        ]);  //End of async.waterfall    
    }
};

//每日访问的UV
exports.accessUV = function(phoneNumber){
    addToUV(UV_SET_ACCESS, phoneNumber);
};

//跳出的UV
exports.jumpUV = function(phoneNumber){
    addToUV(UV_SET_JUMP, phoneNumber);
};

//点击type的UV
exports.clickUV = function(phoneNumber, type){
    addToUV(UV_SET_CLICK + type, phoneNumber);
};

exports.makeOrder = function(phoneNumber, type, isSuccess, orderResult, cb){
    var flag = isSuccess ? 'Success_' : 'Failure_';
    var today = getTodayDate();

    async.waterfall([                   //不能用Set数据结构  因为一个用户有可能订购多个
            function(cb){
                client.RPUSH(flag + today, phoneNumber + '|' + type + '|' + orderResult, function(err, result){
                    cb(err, result);    //return the length of the list after the push operation.
                });        
            },

            function(length, cb){
                client.HSET(HASH_ALLDAYS, flag + type + ':' + today, length, function(err, result){ //If field already exists in the hash, it is overwritten
                    cb(err, result);    //return 1 if field is a new field in the hash and value was set.
                                        //return 0 if field already exists in the hash and value was updated.
                });
            }
    ]);
    
};

//所有信息都在Hash中
exports.getAllFromHash = function(callback){
    client.multi()
    .HGETALL(HASH_ALLDAYS)
    .exec(function(err, replies){
        callback(err ? err : replies);
    });
};

