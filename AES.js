var crypto = require('crypto');
var SKEY  =new Buffer("21CHINATELEcnCOM", "binary");
// 使用CBC模式，需要一个向量iv，可增加加密算法的强度
var IVSTR   =new Buffer("0201080306050704", "binary");
        // public static byte[] decodeBytes(String str) {
        //  byte[] bytes = new byte[str.length() / 2];
        //  for (int i = 0; i < str.length(); i += 2) {
        //    char c = str.charAt(i);
        //    bytes[i / 2] = (byte) ((c - 'a') << 4);
        //    c = str.charAt(i + 1);
        //    bytes[i / 2] += (c - 'a');
        //  }
        //  return bytes;
        // }

var decodeBytes=function(str){
        var bytes =new Buffer(str.length/2);
        var str2  =new Buffer(str,"ascii");
        for(var i=0;i<str.length;i+=2){
               bytes.writeUInt8((str2[i]-97)*16+(str2[i+1]-97),i/2);
        } 
        return bytes;
};

var _Decrypt=function(mo){
  var m=mo;
  var dStr =decodeBytes(m);
        console.log(dStr); 
  var Decipher=crypto.createDecipheriv("aes-128-cbc", SKEY, IVSTR);
        //Decipher.setAutoPadding(auto_padding=false);
        Decipher.update(dStr);
  var number=Decipher.final();
  console.log("PhoneNumber is:%s",number);
  return number;
}

exports.Decrypt=_Decrypt;

var SKEY2    =new Buffer("0123456789abcdef", "binary");
// 使用CBC模式，需要一个向量iv，可增加加密算法的强度
var IVSTR2   =new Buffer("0123456789abcdef", "binary");

var _DecryptBase64 = function(mo){
    var dStr = new Buffer(mo, 'base64');
//    console.log(dStr);

    var Decipher=crypto.createDecipheriv("aes-128-cbc", SKEY2, IVSTR2);
    Decipher.update(dStr);
    var phone = Decipher.final();
    console.log("PhoneNumber is: %s", phone);
    return phone;
};

exports.DecryptBase64 = _DecryptBase64;

