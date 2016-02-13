'use strict'
const fs = require('fs');
const parse = require('csv-parse');
const turf = require('turf');

// let key = JSON.parse(fs.readFileSync('data/age-sex.json', 'utf8'));
//
// let outputfile = 'report.json'
//
// let output = []

var parser = parse({delimiter: ';'}, function(err, data){
  console.log(data);
});

fs.createReadStream(__dirname+'/fs_read.csv').pipe(parser);


// for (let tract in sf) {
//   output.push(+sf[tract][demog])
}



// fs.writeFile(outputfile, JSON.stringify(output),
//   function(err) {
//     if (err) { return console.log(err); }
//     console.log("The file was saved as", outputfile);
//   }
// );
