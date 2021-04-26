#! /bin/bash
exec >> $BASE_PATH/log.txt
exec 2>&1

NOW=$(date +"%D %T")
echo $NOW

echo 'Running graph Node.js app'
cd $BASE_PATH
node index.js
git commit -am "$NOW - Update Graphs"
git push origin main
