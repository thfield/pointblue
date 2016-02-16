#!/bin/bash
# ls raw |grep HST > hst.txt
# ls raw |grep CCSM4_rcp85 > CCSM4_rcp85.txt
cd raw
# for filename in `cat ../hst.txt` ; do
for filename in `cat ../model.txt` ; do
  csvtojson $filename >CCSM4_rcp85/${filename%.*}.json
done
cd ..
