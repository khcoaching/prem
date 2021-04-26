#! /bin/bash
exec >> $KIMCHI_PATH/log.txt
exec 2>&1

date +"%D %T"
echo 'Running exchange-rate Node.js app'
cd $KIMCHI_PATH && node exchange-rate.js
