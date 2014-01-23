var checkOracle = require('./oracle').checkBill;

checkOracle('13376817631', function(rrr){
    console.log(rrr);

    var status1Count = 0;
    for(var r in rrr){
        console.log(rrr[r].STATUS);
        if(rrr[r].STATUS === '1'){
            status1Count++;    
        }
    }

    console.log('status1Count: ' + status1Count);
});
