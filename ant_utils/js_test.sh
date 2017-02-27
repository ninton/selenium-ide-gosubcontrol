#!/bin/bash
# js_test testResults test_xxx.html

echo "js_test.sh $1 $2"

test_html=$2
result_xml=$1/`basename $2`.xml

phantomjs test/phantomMain.js $test_html >$result_xml

failed=`grep "<failure" $result_xml | wc -l`
if [ "$failed" != "0" ]; then
	echo $result_xml
	cat $result_xml
	exit $failed
fi

failed=`grep "SyntaxError" $result_xml | wc -l`
if [ "$failed" != "0" ]; then
	echo $result_xml
	cat $result_xml
	exit $failed
fi
