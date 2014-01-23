var getTodayDate = function(){
    var now = new Date('2034-12-24');
    var year = now.getFullYear();
    var month = now.getMonth()  < 9 ? '0' + (now.getMonth() + 1) : now.getMonth() + 1;
    var day = now.getDate() < 10 ? '0' + now.getDate() : now.getDate();
    return year + '-' + month + '-' + day;
};

var id = setTimeout(function(){
    console.log('I Worked ...');
    console.log(getTodayDate());
    }, 3000);

setTimeout(function(){
    console.log('I Clear Timeout !!!');
    clearTimeout(id);
    console.log(getTodayDate());
    }, 4500);
