//https://github.com/milewise/node-soap
//npm install soap
var soap = require('soap');
var crypto = require('crypto');

var now = new Date();

var _getType=function(number,cb){

//var url = 'http://115.239.134.77/flow/services/FlowInterfaceAdapter?wsdl';
var url = 'http://172.13.0.31:8080/flow/services/FlowInterfaceAdapter?wsdl';

//需要检查入口参数
var System_Id     =0;
var Region_Id     =71;
var Code_Type     =2;
var Code_Number   =number.toString();
//var Start_Date    ="20130901000000";
//var End_Date      ="20130916000000";
//把时间改为动态的
var Start_Date = '' + now.getFullYear() + (now.getMonth() + 1) + '01' + '000000';
var End_Date = '' + now.getFullYear() + (now.getMonth() + 1) + now.getDate() + '000000';

var args = {System_Id:System_Id,Region_Id:Region_Id,Code_Type:Code_Type,Code_Number:Code_Number,Start_Date:Start_Date,End_Date:End_Date};
console.log("====FORM getUserType======");
console.log(args);
soap.createClient(url, {endpoint : url}, function(err, client) {
  if(!err){
      //console.dir(client.describe());
      client.getFreeRes(args, function(err, result) {
          if(!err){  
            console.log(result);
            
            if(result.hasOwnProperty("getFreeResReturn")){

   //           var rc=result["getFreeResReturn"].indexOf("1130");   //如果其他字段包含1130会误判
              var rc=result["getFreeResReturn"].indexOf("<FreeResType>1137</FreeResType>");
//              console.log("USER TYPE %d",rc);
              if(rc != -1){
                cb("liuliang");
              }else{
                cb("not-liuliang");
              }
            }//End of hasOwnProperty

          }else{
            console.log("client ERROR");
            console.log(err);
          }
      });
  }else{

    console.log("creatClient ERROR");
    console.log(err);
  }
});
}//End of function

exports.getType=_getType;

//_getType('18006783900', function(r){console.log(r);});
