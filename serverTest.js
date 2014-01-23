var express = require('express');

var app =express();
 
 app.listen(22222);

 console.log('listening port 22222...');

app.get('/:seconds', function(req, res){
    var seconds = req.params.seconds;
    var i = 0;
    var ID = setInterval(function(){
            i++;
            if(i == seconds){
                clearInterval(ID);    
                console.log("Clear Interval !!!");
            }
            console.log('Working on The way ...');
            }, 1000);
    res.send('OOKK\n');     
});
