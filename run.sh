#! /bin/bash
exec >> $KIMCHI_PATH/log.txt
exec 2>&1

date +"%D %T"
echo 'Running graph Node.js app'
cd $KIMCHI_PATH && node index.js
