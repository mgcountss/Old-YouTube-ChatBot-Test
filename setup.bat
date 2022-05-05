@echo off
title YouTube ChatBot
color 0a
echo                                        xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
echo                                        x            YouTube ChatBot             x
echo                                        xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
echo Please Run As Administrator!
timeout -t 3
IF EXIST "liveChatId.txt" (
   echo
   echo
   timeout -t 3
) ELSE (
    echo loading > liveChatId.txt
    echo 'File missing!'
    echo 'Creating File!'
    timeout -t 3
)
IF EXIST "archive.json" (
   echo
   echo
   timeout -t 3
) ELSE (
    echo [] > archive.json
    echo 'File missing!'
    echo 'Creating File!'
    timeout -t 3
)
IF EXIST "chatMessages.json" (
   echo
   echo
   timeout -t 3
) ELSE (
    echo [] > chatMessages.json
    echo 'File missing!'
    echo 'Creating File!'
    timeout -t 3
)
IF EXIST "botToken.json" (
   echo
   echo
   timeout -t 3
) ELSE (
    echo {} > botToken.json
    echo 'File missing!'
    echo 'Creating File!'
    timeout -t 3
)
IF EXIST "streamerToken.json" (
   echo
   echo
   timeout -t 3
) ELSE (
    echo {} > streamerToken.json
    echo 'File missing!'
    echo 'Creating File!'
    timeout -t 3
)
echo --------------------------------------
echo Starting Bot...
echo --------------------------------------
echo Starting Streamer...
echo --------------------------------------
echo Starting ChatBot...
echo --------------------------------------
node .
start "" http://localhost
timeout -t 10
echo All Done!
timeout -t 3