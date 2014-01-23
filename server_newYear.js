var express = require('express');
var async = require('async');

var redis =  require('./redis.js');
var soap_type = require('./soap_getType.js');
var soap_order = require('./soap_orderRate.js');
var soap_free = require('./soap_freeOrder.js');
var AES = require('./AES.js');
var checkOracle = require('./oracle.js').checkBill;

var app = express();
app.use('/', express.static(__dirname + '/public'));
//加入这一行虽然能导入index 但是不经过get跟路由  不是我们所愿
//app.use('/', express.static(__dirname + '/myPages'));
app.use(express.bodyParser({}));
app.use(express.cookieParser());

app.engine('html', require('ejs').__express);
app.set('view engine', 'html');
//app.set("view engine","ejs");
app.set('views', __dirname + '/myPages');

var port = 8195;
app.listen(port);

console.log('Happy-New-Year Server Listening Port: %d ...', port);

//app.get('/:name', function(req, res, next){
//    var name = req.params.name;
//    res.send("Your Name is : " +  name);
//    
//    });

var EXPIRE = 300;           // exist 5 minutes
var getDate = function(){
        var now = new Date();
            return now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
};
//简易的字符串hash识别实现
var easyHash = function(str){
    var hash = 0;
    if(str.length == 0) return hash;

    for(var i=0; i<str.length; i++){
        char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32 bit integer
    }

    return hash;
};

app.get('/', function(req, res){
    redis.accessPV();                                       //访问PV
    var phonenumber=123123123;

    console.log("===========STARTED==============");
    console.log(req.headers);
    
    var phonenumber = req.headers["x-up-calling-line-id"]; //获取wap登陆实际手机号
    console.log("=====I am in cookies parser===");
    console.log(req.cookies);
    console.log(req.cookies.zjsns_mobile);
    console.log("-----I am in query parser-----");
    console.log(req.query);

    if(req.cookies.zjsns_mobile != undefined){
        var phone_cookie=req.cookies.zjsns_mobile;

        if(phone_cookie.length === 11 && phone_cookie.charAt(0) === '1'){
            console.log('%%%%%%%%%%%%%Cookie没加密的cookies手机号#################');
            phonenumber = phone_cookie;
        }else{
            console.log('加密的Coolies: ' + phone_cookie);
            phonenumber=AES.DecryptBase64(phone_cookie);
            console.log("解密的手机号: %s", phonenumber);
        }
    }

    if(phonenumber == null || phonenumber == "") {      //获取不到wap手机号
        phonenumber = "";
        var mo = req.query.mo;                          //取mo参数，解密出手机号
        if(mo != null){
            if(mo == "debug"){
                phonenumber = "18006783900";
//                phonenumber = '13376817631';
            }else{
                phonenumber = AES.Decrypt(mo);
            }
        } //END of mo parameter
    } //END of phone number == null

    if(phonenumber != null)  phonenumber = phonenumber.toString().trim();   //解密完时Buffer在缓冲区  转为String 

    console.log(getDate() + '_下面显示手机号码-------------------------');
    console.log('The final PhoneNumber is ' +phonenumber);

    console.log('下面是用户HTTP headers中药Hash的property：');
    console.log("x-real-ip: " + req.headers['x-real-ip']);
    console.log('user-agent: ' + req.headers["user-agent"]);
    var secret = 'M' + easyHash(req.headers['x-real-ip'] + req.headers['user-agent']);
    var info = "nothing";
    
    if(phonenumber != '' && phonenumber != undefined){    //能获取到手机号
        redis.accessUV(phonenumber);

        soap_type.getType(phonenumber, function(t){       //判定类型
            console.log('%s 的类型是: %s', phonenumber, t);

            if(t === 'liuliang'){               //验证ttl
                redis.verifyTTL(secret, function(i){
                    if(i){
                        info = i;
                        console.log('取到之前的info了啊, 用户返回继续了@@@@@@@@@@@@@----info: ' + info);
                    }

                    //console.log('假装获取到手机号还渲染Not-Liu-Liang');
                    //res.render('notliuliang');     return;
                    res.render('index', {phone : phonenumber, secret : secret, info : info});
                });
            }else{
                res.render('notliuliang');
            }
        });
    }else{                                                //不能得到手机号  仍然跳转到index  单传过去secret及info
        redis.noNumberPV();
        console.log('没得到手机号?????Secret和info分别是 %s,  %s', secret, info);
        //根据x-real-ip和user-agent作为用户跳转回来的密钥
        res.render('index', {phone : 'redirect', secret : secret, info : info});
    }
});

//暂时没有获取到手机号码的订单在Redis中标记5min的ttl  等待回归
app.post('/markTTL', function(req, res){
    var userSecret = req.body.userSecret;
    var info = req.body.info;
    var expire = req.body.expire;

    console.log('收到secret: ' + userSecret);
    console.log('订购信息: ' +  info);
    console.log('Expire: ' + expire);

    redis.setTTL(userSecret, info, expire, function(r){       //300 seconds
        res.send(r);    
    });
});
app.post('/execOrder', function(req, res){
    var phone = req.body.phone;
    var type = req.body.type;
    var userSecret = req.body.secret;
    var ttlInfo = req.body.info;
    console.log('execOrder收到phone: %s, type: %s, secret: %s, info: %s', phone, type, userSecret, ttlInfo);

//    if(type == 21)
//        res.render('success', {okInfo : '测试的成功订购结果!'});
//    else
//        res.render('failture', {errorInfo:'错误内容'});
//    return;

    async.waterfall([
        function(cb){
            soap_type.getType(phone, function(t){
                console.log('%s 的类型是: %s', phone, t);
                if(t === 'liuliang'){
                    cb(null, t);
                }else{
                    cb('此次春节活动只对流量版用户开放！', 'ddg');    
                }
            });    
        },
        function(t, cb){
            soap_order.order(phone, type, function(result){           //注释掉真正的soap_order.order(number, type, cb) 方法调用
//                var result = '-测试-订购-结果-';                          //自定义一个假的soap_order.order的回调result  Just For Test

                //result可能的值: 1. 手机号码格式不正确, 请查证  2. null 3. 订单提交成功
                if(result != null && 
                    result != 'null' && 
                    result.toString().indexOf('失败') == -1 && 
                    result != '手机号码格式不正确, 请查证'){            //订单成功的判断条件
                    cb(null, result + '，订单将在24小时内生效！');
                }else{
                    cb((result == null || result == 'null' ? '未知错误' : result.toString()) + ', 请稍候重试 ...', 'ddg_mnt_bbc');    
                }    
            });     //End of soap_order.order    
        }
    ], function(err, rt){
        console.log('waterfall的结果: ' + rt);
        console.log('err: ' + err);
        if(err){                                       //Order Failture
            redis.makeOrder(phone, type, false, err.toString(), function(r){});

//            res.render('failture.html', {errorInfo : err.toString()});    //跳转有可能超时   改用弹窗
            res.send(err.toString());    
        }else{                                         //Order Success                                  
            if(ttlInfo != null){            //secret不是TTL专属  info才是判断TTL的标准
                //如果是在TTL的时效内返回并且成功提交了订单   就clear TTL
                redis.setTTL(userSecret, 'clear-ttl-after-order-success', 5, function(r){       
                    console.log('在TTL的时效内返回并且成功提交了订单');
                });
            }

            var unique = phone + '_' + new Date().getTime().toString();

            console.log('Unique================: ' + unique);

            redis.addToFree10MMission(unique, function(result){

                var ID = setInterval(function(){
                    makeCycleRequestForPresent(phone, type, unique, ID);
                }, 10 * 1000);   //End of setInterval 3 hours
                
                redis.makeOrder(phone, type, true, rt.toString(), function(rr){});        //order细节一起统计
                redis.orderOK(type, function(rr){});                                //只统计成功的数量

//                res.render('success', {okInfo : rt.toString() + '，受理成功后即送10M流量，请耐心等待...'});  //跳转有可能超时   改用弹窗 
                res.send(rt.toString() + ' 受理成功后即送10M流量，请耐心等待...');   
            });  //End of addToFree10MMission  
        }
    });
});

//周期性地查询用户订单是否成功  虽不能区分出多个订单的先后顺序及细节   但从总量上可以判断  几个成功的fromid=chunjie的订单  就赠送几个10M
function makeCycleRequestForPresent(phone, type, unique, intervalID){
    if(phone.constructor === String && intervalID != null ){
        checkOracle(phone, function(logs){   //所有操作都在查询Oracle日志之后进行
            var status1Count = 0;
            for(var n in logs){
                if(logs[n].STATUS === '1'){
                    status1Count++;    
                }    
            }

console.log(phone + '查oracle成功订单总数是: ' + status1Count);

            async.auto({
                'RefreshTotalSuccessCount':function(callback){      //更新chunjie活动中status=1的总数
                    redis.refreshSuccessOrderCount(phone, status1Count, function(result){  
                        callback();
                    });
                },
                'GetPresentsAlreadyOK'    :function(callback){      //获取之前已经赠送成功10M的次数
                    redis.getPresentsAlready(phone, function(alreadyOK){
                        var gap = status1Count - alreadyOK;         //还需额外赠送的次数
                        
                        if(gap === 0){               //没有新任务加入     进入页面时所有任务都已经完成  当即clearInterval
                            clearInterval(intervalID);
                            return;
                        }

                        callback(null, gap > 0 ? gap : 0);
                    });    
                },                        
                'CyclePresentByGap':['RefreshTotalSuccessCount', function(callback, results){
//                    console.log('传过来的任务差距gap数目: ' + results.GetPresentsAlreadyOK);
                    var temp = 0;
                    var done = 0;    //在本次whilst循环中成功赠送的次数

                    async.whilst(
                        function(){return temp < results.GetPresentsAlreadyOK;},
                        function(cycle){
                            soap_free.order(phone, '1010', function(msg){           //10M -> flowId : '1010'
                                if(msg.toString().indexOf('订单接受成功') > -1){
//                                if(Math.random() > 0.5)                          //决定赠送是否成功的伪随机事件 取代判断msg内容的逻辑
                                    done++;
                                    redis.present10MOK(type, function(ert){});                  //只统计成功的数量
                                    redis.move10MMissionToSuccess(unique, function(rrr){        //连细节一起统计
                                        console.log('Move 的结果: ' + rrr);
                                    });
                                }    
                            
                                temp++;
                                cycle();
                            });     //End of soap_free.order   
                        },      //End of cycle
                        function(err, rrr){
                            console.log('whilst 结束后的 done 也就是搞定的数量: ' + done);

                            redis.incrPresentsAlready(phone, done, function(rr){
                                //如果done === gap 则本次任务全部完成  clearInterval 
                                if(done === results.GetPresentsAlreadyOK){
                                    clearInterval(intervalID);   //此次完成了所有任务    
                                    console.log('All Game Over ....');
                                }
                            });
                        }
                    ); //End of async.whilst
                }]
            }, function(err, results){
                    
            });     //End of async.auto
        });     //End of checkOracle
    }   //End of args OK
};

//统计Click事件
app.post('/clickType', function(req, res){
    var phone = req.body.phone;
    var type = req.body.type;
    if(type == '21' || type == '22'){
        redis.clickPV(type);
        redis.clickUV(phone, type);
    }

    console.log(phone + ' has click type ' + type);
    res.send(phone + ' Click ' + type);
});

//jump statistics
app.post('/jump', function(req, res){
    var phone = req.body.phone;
    var userSecret = req.body.userSecret;
    var jumpStatus = req.body.jumpStatus;

    redis.jumpPV();
    if(phone == 'redirect'){     //没有得到手机号码的jump
        redis.jumpUV(userSecret); 
    }else{
        redis.jumpUV(phone);
    }
    console.log('Jump de 手机号码: %s, 密钥: %s, JumpStatus: %s', phone, userSecret, jumpStatus);
});

//render statistics.html
app.get('/tj', function(req, res){
    res.render('statistics');
});

app.get('/statisticsData', function(req, res){
    redis.getAllFromHash(function(result){
        res.send(result);
    });
});

