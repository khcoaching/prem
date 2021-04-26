#! /bin/bash
NOW=$(date +"%D %T")
echo $NOW

echo 'Running exchange-rate Node.js app'
cd $BASE_PATH
git pull
node exchange-rate.js
git commit -am "$NOW - Update Graphs"
git push origin main
