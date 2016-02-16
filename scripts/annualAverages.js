// should probably just do this all in sql...
'use strict'
const fs = require('fs');


let key = JSON.parse(fs.readFileSync('key.json', 'utf8'))
let output = {};
let predictionModel = 'HST';

// key = key.slice(0,5); //remove for all basins!

key.forEach(function(basin){

  let filename = 'raw/json/SFB-PWS-' + basin.id + '-' + predictionModel + '.json';
    try {
      fs.accessSync(filename, fs.F_OK); //make sure the file is there
      let basinData = JSON.parse(fs.readFileSync(filename, 'utf8'))
      basinData = formatBasin(basinData)
      let file = 'basin/'+basin.id+'.json'
      writeToFile(basinData,file)
    } catch (e) {
      // console.log('file not found')
        // It isn't accessible
    }
})

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
