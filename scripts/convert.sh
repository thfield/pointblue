#!/bin/bash
# ls raw |grep HST > hst.txt
cd raw
for filename in `cat ../hst.txt` ; do
  csvtojson $filename >json/${filename%.*}.json
done
cd ..
