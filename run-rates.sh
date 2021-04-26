#! /bin/bash
exec >> $KIMCHI_PATH/log.txt
exec 2>&1

NOW=$(date +"%D %T")
echo $NOW

echo 'Running exchange-rate Node.js app'
cd $KIMCHI_PATH
node exchange-rate.js
git commit -am "$NOW - Update Exchange Rates"
git push origin main
