#! /bin/bash
source ~/.env
NOW=$(date +"%D %T")
echo $NOW

echo 'Running graph Node.js app'
cd $BASE_PATH
git pull
node index.js
git commit -am "$NOW - Update Graphs"
git push origin main
