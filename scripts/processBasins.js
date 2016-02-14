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
let predictionModel = 'HST';
let converter = new Converter({});
let everyBasin = [];

let testKey = [{ id: '1113810002', name: 'Robinson Creek' },
               { id: '1113820001', name: 'Middle Rockpile Creek' }];

// delete if item.data[n].year == calyear

key = key.slice(0,100); //remove for all basins!

getData(predictionModel);

function getData(predictionModel){
  let recordPromises = key.map(fetchBasinRecord)
  Promise.all(recordPromises)
    .then(function(results){
      // results.forEach(item=>{
      //   everyBasin.push(item);
      // })
      // writeToFile(everyBasin,'temp.json');
      // everyBasin.forEach(convert);
      for (let year in output){
        writeToFile(output[year],'annual/'+year+'.json');
      }
    })
}

function convert(basinRecord) {
  basinRecord.data.forEach(function(annum){
    output[annum.year] = output[annum.year] || [];
    output[annum.year].push({id:basinRecord.id, temp: annum.temp, precip: annum.precip})
  })
}

function fetchBasinRecord(area){
  let filename = 'raw/SFB-PWS-' + area.id + '-' + predictionModel + '.csv';
  try {
      fs.accessSync(filename, fs.F_OK); //make sure the file is there
      return new Promise((resolve, reject)=>{
        converter.fromFile(filename,function(err,result){ //read the csv files
          let temp = {id: area.id, data:formatBasin(result)};
          convert(temp);
          resolve(temp);
        })
      })

  } catch (e) {
    // console.log('file not found')
      // It isn't accessible
  }
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


function writeToFile(obj, filename){
  fs.writeFile(filename, JSON.stringify(obj), function(err) {
    if(err) {
      console.log('error saving document', err)
    } else {
      console.log('File saved as ' + filename)
    }
  })
}

function foo(bar){
  console.log(bar);
}
