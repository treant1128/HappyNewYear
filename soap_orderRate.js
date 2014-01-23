//https://github.com/milewise/node-soap
//npm install soap
var soap = require('soap');
var crypto = require('crypto');
var parseString = require('xml2js').parseString;

var verifyNumber= function(number){
	if(number.constructor === String){
		if(number.length == 11 && number.charAt(0) == '1'){
			return number;
		}else if(number.length == 13 && number.substring(0, 2) == '86'){
			return number.substr(2);
		}else {
			return "Unknown";
		}
	}
};

//var order_url = 'http://115.239.134.77/flow/services/FlowInterfaceAdapter?wsdl';     //外网
var order_url = 'http://172.13.0.31:8080/flow/services/FlowInterfaceAdapter?wsdl';   //内网  但调方法有误  通过加入endpoint解决

var _order=function(number, type, cb){
//入口参数就一个，就requestParam，另外这个参数就是一整个XML
//
//<?xml version="1.0" encoding="utf-8"?>
//<request>
//<userId>xxx</userId>             必须：手机号
//<aCode>xxx</aCode>               必须（授权码为s_wukong）
//<tp>xxx</tp>
//                                 必须，流量包类型（对应tp的值） 流量包名称
//                                       3  天翼20元包150M手机上网流量
//                                       4  天翼30元包300M手机上网流量
//                                       5  天翼50元包800M手机上网流量

//                                      12  100M免费流量包
//                                      14  50M免费流量包
//                                      15  300M免费流量包
//<globalKey>xxx</globalKey>       必须，规则“用户号码_时间戳”，例如15355096273_1370332441941
//<fromID>xxx</fromID>             必须,统一为微视窗拼音简写wsc
//<verifyPwd>xxx</verifyPwd>       必须，verifyPwd = MD5(aCode +userId)
//<verifyCode>xxx</verifyCode>     必须，verifyCode = MD5(verifyStr)，其中verifyStr，为<request></request>之间的内容
//</request>

//需要检查入口参数

var phonenumber = verifyNumber(number);
if(phonenumber === "Unknown"){
	cb('手机号码格式不正确, 请查证');
	return;
}

var aCode = "s_wukong";
var tp = type; //3yuan 15M
var globalKey = phonenumber + "_" + Date.now();
//var fromID = "wsc";
var fromID = "chunjie";  //更换fromID为chunjie

var md5 = crypto.createHash('md5');
    md5.update(aCode + phonenumber);
var verifyPwd = md5.digest('hex');


var payload = "<userId>" + phonenumber + "</userId>" +
              "<aCode>" + aCode + "</aCode>" +
              "<tp>" + tp + "</tp>" +
              "<globalKey>" + globalKey + "</globalKey>" +
              "<fromID>" + fromID + "</fromID>";
var md5b = crypto.createHash('md5');
    md5b.update(payload);

var verifyCode = md5b.digest('hex');

var verifySeg = "<verifyPwd>" + verifyPwd + "</verifyPwd>" +
                "<verifyCode>" + verifyCode + "</verifyCode>";

var reqStr = "<?xml version='1.0' encoding='utf-8'?><request>" + payload + verifySeg + "</request>"

//console.log("REQUEST:\n%s",reqStr);

var args = {requestParam : reqStr};

soap.createClient(order_url, {endpoint:order_url}, function(err, client) {
//  console.log("I AM CREATE client....");
    if(!err){
        client.orderRate(args, function(err, result) {
            if(!err){
                if(result.hasOwnProperty('orderRateReturn')){
		            var xml = result['orderRateReturn'];
                    parseString(xml, function(err, userResult){
                        //{ respone: { returnCode: [ '1' ], returnMsg: [ '订单提交成功' ] } }
                        var responseMsg = userResult['respone'].returnMsg.join();
                        cb(responseMsg);
                    });
                }else{
    	  	        console.log('-------------hasOwnProperty("orderRateReturn"---Error-----------------');
                    cb("Not OwnProperty---orderRateReturn-----");
                }//END OF hasOwnProperty.....
            }else{
    		    console.log('-------------client.orderRate---Error-----------------');
            	console.log(err);
            	cb(err);
            }//END OF client not err
        });//END of client.orderRate...
    }else{
        console.log('-------------soap.createClient---Error-----------------');
        console.log(err);
        cb(err);
    }
});//END of soap.createClient...


};//END OF FUNCTION
  
//Public Method....
exports.order = _order;


//if(1){
//	_order('18006783900', 21, function(result){
//		console.log(result);
//	});
//}
