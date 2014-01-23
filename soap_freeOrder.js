//https://github.com/milewise/node-soap
//npm install soap
var soap = require('soap');
var crypto = require('crypto');

var _order=function(number,type,cb){

//var order_url = 'http://61.130.6.34/api/ft/service_flow_api.php?wsdl';
var order_url = 'http://134.96.4.123/api/ft/service_flow_api.php?wsdl';

//接口请求消息GetFlowOrderRequest包含如下信息：
//名称                描述            类型(字符长度)    IsNull
//userName            接口账号        String (<20)      No        if_test
//userPwd             接口密码        String(<20)       NO        123456
//activeUniqe         活动唯一标识符  String (<10)      NO        aaaaaaaa
//userPhone           用户手机号码    String (<15)      NO        13376817631
//timeStamp           时间戳          Number(<20)       NO
//flowId              流量包ID        String(<5)        NO        1010
//<?xml version="1.0" encoding="utf-8"?>
//<request>

//需要检查入口参数
var userName      ="wukong3479";
var userPwd       ="wk7832ll";
var activeUniqe   ='50932432';   //不同活动更换活动标示  "37714779";


var timeStamp     =Date.now();
var flowId        ="1010";
var userPhone     =number||"13376817631";

if(type=="1010"){
  flowId="1010";
}else{
  flowId="1020";
}

var jsReq={userName:userName,userPwd:userPwd,activeUniqe:activeUniqe,userPhone:userPhone,timeStamp:timeStamp,flowId:flowId};
var GetFlowOrderRequest=jsReq;

console.log(jsReq);

soap.createClient(order_url,{endpoint:order_url}, function(err, client) {
  if(!err){
//      console.dir(JSON.stringify(client.describe()));
//      console.log('dir is OK');

      client.GetFlowOrder(GetFlowOrderRequest, function(err, result) {
          console.log(result);
          if(!err){
              if(result.hasOwnProperty("flag")){
                    if(result["flag"] == "100"){
                        cb("订单接受成功！");
                    }else if(result["flag"] == "101"){
		                cb("用户鉴权失败！");
		            }else if(result["flag"] == "103"){
		                cb("之前订单未处理完成！");
		            }else if(result["flag"] == "104"){
                        cb("号码办理超过规定次数！");    
                    }else if(result["flag"] == "105"){
                        cb("订单号已经存在！");
                    }else if(result["flag"] == "106"){
                        cb("数据库获取数据异常！");
                    }else{
                        cb("未知错误！");
                    }
              }else{
                  console.log("Unknown ERROR");
                  cb("Unknown Error");
              }
          }else{
            console.log(err);
            cb(err);
          }
      });
  }else{
    console.log(err);
    cb(err);
  }
});
};
  
//Public Method....
exports.order = _order;

//if(1){
//    _order('18006783900', '1010', function(msg){
//        console.log(msg);
//    });
//}
