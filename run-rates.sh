#! /bin/bash
exec >> "$BASE_PATH/log.txt"
exec 2>&1

NOW=$(date +"%D %T")
echo $NOW

echo 'Running exchange-rate Node.js app'
cd $BASE_PATH
node exchange-rate.js
git commit -am "$NOW - Update Graphs"
git push origin main
