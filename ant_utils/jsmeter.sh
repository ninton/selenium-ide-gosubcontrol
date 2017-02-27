#!/bin/bash

echo jsmeter.sh
echo '$1: ' $1
echo '$2: ' $2
 
jsmeter $1 

php ant_utils/jsmeter_result.php $2

