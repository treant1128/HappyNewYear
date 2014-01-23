var async = require('async');


async.auto({
    getData: function (callback) {
        setTimeout(function(){
            console.log('111: got data');
            callback();
        }, 300);
    },
    makeFolder: function (callback) {
        setTimeout(function(){
            console.log('222: made folder');
            callback();
        }, 200);
    },
    writeFile: ['getData', 'makeFolder', function(callback) {
        setTimeout(function(){
            console.log('333: wrote file');
            callback(null, '回调传入的文件myfile');
        }, 300);
    }],
    emailFiles: ['writeFile', function(callback, results) {
        console.log('444: emailed file: ', results.writeFile); // -> myfile
        callback(null, '最后的晚餐');
    }]
}, function(err, results) {
    console.log('555: err: ', err); // -> null
    console.log('666: results: ', results); // -> { makeFolder: undefined,
                                    //      getData: undefined,
                                    //      writeFile: 'myfile',
                                    //      emailFiles: 'myfile' }
});
