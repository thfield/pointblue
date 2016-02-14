'use strict'
const fs = require('fs');
const turf = require('turf');

let inputFile = 'watersheds.geo.json',
    inputData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
let outputFile = "geoInfo.json",
    outputData = {};

outputData.centerPt = turf.centroid(inputData);
outputData.envelope = turf.envelope(inputData);


// let features = [
//   outputData.centerPt,
//   outputData.envelope
// ]
// outputData = turf.featurecollection(outputData.envelope)


writeToFile(outputData, outputFile);

function writeToFile(obj, filename){
  fs.writeFile(filename, JSON.stringify(obj), function(err) {
    if(err) {
      console.log('error saving document', err)
    } else {
      console.log('File saved as ' + filename)
    }
  })
}


/*
command line to convert to topo
topojson -o watersheds-topo2.json --id-property zone --properties name=mm_label --simplify-proportion .2 watersheds.geo.json
*/