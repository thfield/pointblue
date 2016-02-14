
'use strict'
const fs = require('fs');


let file = JSON.parse(fs.readFileSync('annual/2000.json', 'utf8'))
let key = JSON.parse(fs.readFileSync('key.json', 'utf8'))
console.log(file.length)
console.log(key.length)


