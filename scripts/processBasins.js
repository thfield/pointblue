// should probably just do this all in sql...
'use strict'
const fs = require('fs');
const Converter = require('csvtojson').Converter;

// // read the key file -only need to do this once, saved as key.json
// let key = [];
// let keyFile = 'huc.csv';
// converter.fromFile(keyFile,function(err,result){
//   key = result.map(function(record){
//     return {id: record.basin, name: record.name}
//   });
//   writeToFile(key,'key.json')
// });

let key = JSON.parse(fs.readFileSync('key.json', 'utf8'))
let output = {};
let outputfile = 'data.json';
let predictionModel = 'CCSM4_rcp85';
let converter = new Converter({});
let everyBasin = [];

let testKey = [{ id: '1113810002', name: 'Robinson Creek' },
               { id: '1113820001', name: 'Middle Rockpile Creek' }];


// key = key.slice(0,5); //remove for all basins!

key.forEach(function(basin){
  let filename = 'raw/'+predictionModel+'/SFB-PWS-' + basin.id + '-' + predictionModel + '.json';
    try {
      fs.accessSync(filename, fs.F_OK); //make sure the file is there
      let basinData = JSON.parse(fs.readFileSync(filename, 'utf8'))
      basinData = formatBasin(basinData);
      convertToYearDict(basinData, basin.id);

      //following 2 lines are duplicated in scripts/annualAverages.js
      let file = predictionModel+'/basin/'+basin.id+'.json'
      writeToFile(basinData,file)
    } catch (e) {
      // console.log('file not found')
        // It isn't accessible
    }
})

for (let year in output){
  let file = predictionModel+'/annual/'+year+'.json'
  writeToFile(output[year],file);
}



function formatBasin(data){
  let obj = {};
  let arr = [];
  data.forEach(function(record){
    obj[record.calyear] = obj[record.calyear] || {};
    obj[record.calyear].temp = obj[record.calyear].temp || [];
    obj[record.calyear].precip = obj[record.calyear].precip || [];
    obj[record.calyear].temp.push(+record.tmax);
    obj[record.calyear].precip.push(+record.ppt);
  })
  for (let year in obj){
    let tempSum = obj[year].temp.reduce((a,b)=>{return a+b});
    obj[year].temp = tempSum/obj[year].temp.length;
    obj[year].precip = obj[year].precip.reduce((a,b)=>{return a+b});
    arr.push({year: year, temp:obj[year].temp, precip: obj[year].precip});
  }
  return arr;
}

function convertToYearDict(basinRecord, basinId) {
  basinRecord.forEach(function(annum){
    output[annum.year] = output[annum.year] || [];
    output[annum.year].push({id:basinId, temp: annum.temp, precip: annum.precip})
  })
}


function writeToFile(obj, filename){
  fs.writeFile(filename, JSON.stringify(obj), function(err) {
    if(err) {
      console.log('error saving document', err)
    } else {
      console.log('File saved as ' + filename)
    }
  })
}
