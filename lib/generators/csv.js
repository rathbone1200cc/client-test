var
csv = require('csv')
;

exports.parse = function(path, callback){
  var fieldNames = [];
  var jrows = [];
  var open = true;
  var reader = csv().from.path(path, { delimiter: ',', escape: '"' });

  reader.on('record', function(crow,index){
    if (index === 0){ for (h in crow){ fieldNames.push(crow[h]); } }
    else {
      var jrow = {};
      for (i in crow){
        var key = fieldNames[i];
        jrow[key] = crow[i];
      }
      jrows.push(jrow);
    }
  });

  function finish(){
    if (open) { callback(null, jrows); }
    open = false;
  }
  reader.on('close', finish);
  reader.on('end', finish);
  reader.on('error', function(error){
    console.log(error.message);
    callback(error);
  });
}
