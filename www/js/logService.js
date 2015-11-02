app.factory('logService', function () {
    var log = { entries: new Array() };

    return {
        log: function(x){
            log.entries.unshift(x);
            if (log.entries.length > 100)
                log.entries = log.entries.splice(0, 80);
            console.log(x);
        },
        getLog: function(y){
            return log;
        }
    }
})