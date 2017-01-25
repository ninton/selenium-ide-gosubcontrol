/*jslint white:true*/
/*global YUI */
/*global Selenium, LOG, testCase */
/*global GosubControlClass */

YUI({logInclude: {TestRunner: true}}).use("test", "console", "test-console", "phantomjs",
    function(Y) {
        "use strict";

        var MockLOG,
            areSame,
            areSameArray,
            areSameObject,
            gosubControl;

        MockLOG = function () {
            var self = {};

            self.infoMessages = [];
            self.debugMessages = [];

            self.info = function (mesg) {
                self.infoMessages.push(mesg);
            };

            self.debug = function (mesg) {
                self.debugMessages.push(mesg);
            };

            return self;
        };

        areSameArray = function (expected, actual) {
            Y.Assert.areSame(expected.length, actual.length);

            expected.forEach(function(value, i) {
                areSame(value, actual[i]);
            });
        };

        areSameObject = function (expected, actual) {
            Object.keys(expected).forEach(function(key) {
                if (!expected.hasOwnProperty(key)) {
                    return;
                }

                areSame(expected[key], actual[key]);
            });
        };

        areSame = function (expected, actual) {
            if (typeof expected !== "object") {
                Y.Assert.areSame(expected, actual);
            } else {
                if (expected.length === undefined) {
                    areSameObject(expected, actual);
                } else {
                    areSameArray(expected, actual);
                }
            }
        };

        gosubControl = new GosubControlClass();
        
        Y.Test.Runner.add(new Y.Test.Case({
            name: "testEcho",
            "testEcho": function() {
                var myLog = new MockLOG();

                gosubControl.init(myLog, testCase);
                gosubControl.log.info("Abc");
                gosubControl.log.info("xYz");

                areSame(["gosubInit", "Abc", "xYz"], myLog.infoMessages);
            }
        }));

        Y.Test.Runner.add(new Y.Test.Case({
            name: "getIndex",
            "testGetIndex": function() {

                var testData = [
                    {
                        index: 0,
                        expected: 0
                    },
                    {
                        index: 1,
                        expected: 1
                    }
                ];

                testData.forEach(function (data) {
                    testCase.debugContext.debugIndex = data.index;
                    Y.Assert.areSame(data.expected, gosubControl.getIndex());
                });
            }
        }));

        Y.Test.Runner.add(new Y.Test.Case({
            name: "setIndexNormal",
            "testSetIndexNormal": function() {

                var testData = [
                    {
                        index: 1,
                        setIndex: 123,
                        expected: 123
                    },
                    {
                        index: 2,
                        setIndex: 234,
                        expected: 234
                    }
                ];

                testData.forEach(function (data) {
                    testCase.debugContext.debugIndex = data.index;
                    gosubControl.setIndex(data.setIndex);
                    Y.Assert.areSame(data.expected, testCase.debugContext.debugIndex);
                });

            }
        }));

        Y.Test.Runner.add(new Y.Test.Case({
            name: "setIndexError",
            "testSetIndexError": function() {

                var testData = [
                    {
                        index: 1,
                        setIndex: -2,
                        expected: {
                            index: 1,
                            errnum: "E08"
                        }
                    },
                    {
                        index: 2,
                        setIndex: undefined,
                        expected: {
                            index: 2,
                            errnum: "E08"
                        }
                    },
                    {
                        index: 3,
                        setIndex: null,
                        expected: {
                            index: 3,
                            errnum: "E08"
                        }
                    }
                ];

                testData.forEach(function (data) {
                    var errnum;

                    testCase.debugContext.debugIndex = data.index;

                    try {
                        gosubControl.setIndex(data.setIndex);
                    } catch (e) {
                        errnum = e.errnum;
                    }

                    Y.Assert.areSame(data.expected.errnum, errnum);
                    Y.Assert.areSame(data.expected.index, testCase.debugContext.debugIndex);
                });

            }
        }));

        Y.Test.Runner.add(new Y.Test.Case({
            name: "testInit_Normal",
            "testInit_Normal": function() {

                var testData = [
                    {
                        commands: [
                        ],
                        expected: {
                            subroutineMap: {
                            },
                            messages: [
                                "gosubInit"
                            ]
                        }
                    },
                    {
                        commands: [
                            {type: "command" , command: "open",   target: "http://www.example.jp"},
                            {type: "command" , command: "store",  target: "x"},
                            {type: "command" , command: "verify", target: "x"}
                        ],
                        expected: {
                            subroutineMap: {
                            },
                            messages: [
                                "gosubInit"
                            ]
                        }
                    },
                    {
                        commands: [
                            {type: "command" , command: "gosub",  target: "mysub1"},
                            {type: "command" , command: "sub",    target: "mysub1"},
                            {type: "command" , command: "verify", target: "x"},
                            {type: "command" , command: "endsub", target: ""},
                            {type: "command" , command: "sub",    target: "mysub2"},
                            {type: "command" , command: "verify", target: "x"},
                            {type: "command" , command: "endsub", target: ""}
                        ],
                        expected: {
                            subroutineMap: {
                                "mysub1": {sub: 1, end: 3},
                                "mysub2": {sub: 4, end: 6}
                            },
                            messages: [
                                "gosubInit"
                            ]
                        }
                    }
                ];

                testData.forEach(function(data) {
                    var myLog    = null;

                    myLog = new MockLOG();
                    testCase.commands = data.commands;

                    gosubControl.init(myLog, testCase);

                    areSameObject(data.expected.subroutineMap, gosubControl.subroutineMap);
                    areSameArray(data.expected.messages, myLog.infoMessages);
                });
            }
        }));

        function testInit_Error (data) {
            var myLog    = null,
                errnum   = "";

            myLog = new MockLOG();
            testCase.commands = data.commands;

            try {
                gosubControl.init(myLog, testCase);
            } catch (e) {
                errnum = e.errnum;
            }

            Y.Assert.areSame(data.expected.errnum, errnum);
        }

        Y.Test.Runner.add(new Y.Test.Case({
            name: "testInit_E01",
            "testInit_E01": function() {

                var testData = [
                    {
                        commands: [
                            {type: "command" , command: "sub",  target: ""}
                        ],
                        expected: {
                            errnum: "E01"
                        }
                    },
                    {
                        commands: [
                            {type: "command" , command: "sub"}
                        ],
                        expected: {
                            errnum: "E01"
                        }
                    },
                    {
                        commands: [
                            {type: "command" , command: "sub", target: "mysub1"},
                            {type: "command" , command: "endsub"},
                            {type: "command" , command: "sub", target: ""}
                        ],
                        expected: {
                            errnum: "E01"
                        }
                    }
                ];

                testData.forEach(testInit_Error);
            }
        }));

        Y.Test.Runner.add(new Y.Test.Case({
            name: "testInit_E02",
            "testInit_E02": function() {

                var testData = [
                    {
                        commands: [
                            {type: "command" , command: "sub", target: "mysub1"},
                            {type: "command" , command: "endsub"},
                            {type: "command" , command: "sub", target: "mysub1"}
                        ],
                        expected: {
                            errnum: "E02"
                        }
                    }
                ];

                testData.forEach(testInit_Error);
            }
        }));

        Y.Test.Runner.add(new Y.Test.Case({
            name: "testInit_E03",
            "testInit_E03": function() {

                var testData = [
                    {
                        commands: [
                            {type: "command" , command: "sub", target: "mysub1"},
                            {type: "command" , command: "sub", target: "mysub2"},
                            {type: "command" , command: "endsub"}
                        ],
                        expected: {
                            errnum: "E03"
                        }
                    }
                ];

                testData.forEach(testInit_Error);
            }
        }));

        Y.Test.Runner.add(new Y.Test.Case({
            name: "testInit_E04",
            "testInit_E04": function() {

                var testData = [
                    {
                        commands: [
                            {type: "command" , command: "endsub"}
                        ],
                        expected: {
                            errnum: "E04"
                        }
                    },
                    {
                        commands: [
                            {type: "command" , command: "sub", target: "mysub1"},
                            {type: "command" , command: "endsub"},
                            {type: "command" , command: "endsub"}
                        ],
                        expected: {
                            errnum: "E04"
                        }
                    }
                ];

                testData.forEach(testInit_Error);
            }
        }));

        Y.Test.Runner.add(new Y.Test.Case({
            name: "testInit_E05",
            "testInit_E05": function() {

                var testData = [
                    {
                        commands: [
                            {type: "command" , command: "sub", target: "mysub1"}
                        ],
                        expected: {
                            errnum: "E05"
                        }
                    },
                    {
                        commands: [
                            {type: "command" , command: "sub", target: "mysub1"},
                            {type: "command" , command: "endsub"},
                            {type: "command" , command: "sub", target: "mysub2"}
                        ],
                        expected: {
                            errnum: "E05"
                        }
                    }
                ];

                testData.forEach(testInit_Error);
            }
        }));

        Y.Test.Runner.add(new Y.Test.Case({
            name: "testRun_Normal",
            "testRun_Normal": function() {
                var data     = {},
                    selenium = null;

                data = {
                    commands: [
                        {type: "command" , command: "gosub", target: "mysub1"},
                        {type: "command" , command: "xxx", target: ""},
                        {type: "command" , command: "sub", target: "mysub1"},
                        {type: "command" , command: "endsub"}
                    ]
                };

                selenium = new Selenium();
                testCase.commands = data.commands;

                //
                testCase.debugContext.debugIndex = 0;

                selenium.doGosub("mysub1");

                Y.Assert.areSame(2, selenium.gosubController.subroutineMap.mysub1.sub);
                Y.Assert.areSame(3, selenium.gosubController.subroutineMap.mysub1.end);
                areSameArray([0], selenium.gosubController.stack);

                Y.Assert.areSame(1, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 2;

                selenium.doSub("mysub1");

                areSameArray([0], selenium.gosubController.stack);
                Y.Assert.areSame(2, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 4;

                selenium.doEndsub("");

                areSameArray([], selenium.gosubController.stack);
                Y.Assert.areSame(0, testCase.debugContext.debugIndex);
            }
        }));

        Y.Test.Runner.add(new Y.Test.Case({
            name: "testRun_nestcall",
            "testRun_nestcall": function() {
                var data     = {},
                    selenium = null;

                data = {
                    commands: [
                        {type: "command" , command: "sub",   target: "mysub1"},
                        {type: "command" , command: "gosub", target: "mysub2"},
                        {type: "command" , command: "endsub"},
                        {type: "command" , command: "sub",   target: "mysub2"},
                        {type: "command" , command: "endsub"},
                        {type: "command" , command: "gosub", target: "mysub1"}
                    ]
                };

                selenium = new Selenium();
                testCase.commands = data.commands;

                //
                testCase.debugContext.debugIndex = 0;

                selenium.doSub("mysub1");

                Y.Assert.areSame(0, selenium.gosubController.subroutineMap.mysub1.sub);
                Y.Assert.areSame(2, selenium.gosubController.subroutineMap.mysub1.end);
                Y.Assert.areSame(3, selenium.gosubController.subroutineMap.mysub2.sub);
                Y.Assert.areSame(4, selenium.gosubController.subroutineMap.mysub2.end);
                areSameArray([], gosubControl.stack);

                Y.Assert.areSame(1, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 2;

                selenium.doEndsub("mysub1");

                areSameArray([], selenium.gosubController.stack);
                Y.Assert.areSame(2, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 3;

                selenium.doSub("mysub2");

                areSameArray([], selenium.gosubController.stack);
                Y.Assert.areSame(3, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 4;

                selenium.doEndsub("");

                areSameArray([], selenium.gosubController.stack);
                Y.Assert.areSame(4, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 5;

                selenium.doGosub("mysub1");

                areSameArray([5], selenium.gosubController.stack);
                Y.Assert.areSame(-1, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 0;

                selenium.doSub("mysub1");

                areSameArray([5], selenium.gosubController.stack);
                Y.Assert.areSame(0, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 1;

                selenium.doGosub("mysub2");

                areSameArray([5,1], selenium.gosubController.stack);
                Y.Assert.areSame(2, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 3;

                selenium.doSub("mysub1");

                areSameArray([5,1], selenium.gosubController.stack);
                Y.Assert.areSame(3, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 4;

                selenium.doEndsub("");

                areSameArray([5], selenium.gosubController.stack);
                Y.Assert.areSame(1, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 2;

                selenium.doEndsub("");

                areSameArray([], selenium.gosubController.stack);
                Y.Assert.areSame(5, testCase.debugContext.debugIndex);
            }
        }));

        Y.Test.Runner.add(new Y.Test.Case({
            name: "testRun_error",
            "testRun_error": function() {
                var data     = {},
                    selenium = null,
                    errnum   = "";

                data = {
                    commands: [
                        {type: "command" , command: "gosub", target: "mysubX"},
                        {type: "command" , command: "xxx", target: ""},
                        {type: "command" , command: "sub", target: "mysub1"},
                        {type: "command" , command: "endsub"}
                    ]
                };

                selenium = new Selenium();
                testCase.commands = data.commands;

                try {
                    // at line 0, mysubX not found
                    testCase.debugContext.debugIndex = 0;

                    selenium.doGosub("mysubX");
                } catch (e) {
                    errnum = e.errnum;
                }

                Y.Assert.areSame("E06", errnum);
            }
        }));

        (new Y.Test.Console({newestOnTop:false})).render("#log");
        Y.Test.Runner.run();
    }
);
