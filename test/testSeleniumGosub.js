/*jslint white:true*/
/*global YUI */
/*global Selenium, LOG, testCase */
/*global GosubControl */

YUI({logInclude: {TestRunner: true}}).use("test", "console", "test-console", "phantomjs",
    function(Y) {
        "use strict";

        var MockLOG,
            areSame,
            areSameArray,
            areSameObject;

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

        Y.Test.Runner.add(new Y.Test.Case({
            name: "echo",
            "testEcho": function() {
                var myLog = new MockLOG();

                GosubControl.setLog(myLog);
                GosubControl.log.info("Abc");
                GosubControl.log.info("xYz");

                Y.Assert.areSame(2,     myLog.infoMessages.length);
                Y.Assert.areSame("Abc", myLog.infoMessages[0]);
                Y.Assert.areSame("xYz", myLog.infoMessages[1]);
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
                    Y.Assert.areSame(data.expected, GosubControl.getIndex());                    
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
                    GosubControl.setIndex(data.setIndex);
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
                        GosubControl.setIndex(data.setIndex);
                    } catch (e) {
                        errnum = e.errnum;
                    }

                    Y.Assert.areSame(data.expected.errnum, errnum);
                    Y.Assert.areSame(data.expected.index, testCase.debugContext.debugIndex);
                });

            }
        }));

        Y.Test.Runner.add(new Y.Test.Case({
            name: "testInitOnce",
            "testInitOnce": function() {

                var testData = [
                    {
                        initialized: false,
                        expected: {
                            initialized: true,
                            messages: [
                                "gosubInit"
                            ]
                        }
                    },
                    {
                        initialized: true,
                        expected: {
                            initialized: true,
                            messages: []
                        }
                    }
                ];

                testData.forEach(function(data) {
                    var selenium = null,
                        myLog    = null;

                    selenium = new Selenium();
                    myLog    = new MockLOG();

                    if (data.initialized) {
                        selenium.gosub_initialized = data.initialized;
                    }

                    GosubControl.setLog(myLog);
                    GosubControl.initOnce(selenium);

                    Y.Assert.areSame(true, selenium.gosub_initialized);
                    areSameArray(data.expected.messages, myLog.infoMessages);
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
                            labels: {
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
                            labels: {
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
                            labels: {
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
                    var selenium = null,
                        myLog    = null;

                    selenium = new Selenium();
                    delete selenium.gosub_initialize;

                    myLog = new MockLOG();

                    testCase.commands = data.commands;

                    GosubControl.setLog(myLog);
                    GosubControl.init();

                    areSameObject(data.expected.labels, GosubControl.labels);
                    areSameArray(data.expected.messages, myLog.infoMessages);
                });
            }
        }));

        function testInit_Error (data) {
            var selenium = null,
                myLog    = null,
                errnum   = "";

            selenium = new Selenium();
            delete selenium.gosub_initialize;

            myLog = new MockLOG();

            testCase.commands = data.commands;

            try {
                GosubControl.setLog(myLog);
                GosubControl.init();
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
                    selenium = null,
                    myLog    = null;

                data = {
                    commands: [
                        {type: "command" , command: "gosub", target: "mysub1"},
                        {type: "command" , command: "xxx", target: ""},
                        {type: "command" , command: "sub", target: "mysub1"},
                        {type: "command" , command: "endsub"}
                    ]
                };

                selenium = new Selenium();
                delete selenium.gosub_initialize;

                myLog = new MockLOG();

                testCase.commands = data.commands;

                GosubControl.setLog(myLog);

                //
                testCase.debugContext.debugIndex = 0;

                selenium.doGosub("mysub1");

                Y.Assert.areSame(2, GosubControl.labels.mysub1.sub);
                Y.Assert.areSame(3, GosubControl.labels.mysub1.end);
                areSameArray([0], GosubControl.stack);

                Y.Assert.areSame(1, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 2;

                selenium.doSub("mysub1");

                areSameArray([0], GosubControl.stack);
                Y.Assert.areSame(2, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 4;

                selenium.doEndsub("");

                areSameArray([], GosubControl.stack);
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
                delete selenium.gosub_initialize;

                testCase.commands = data.commands;

                //
                testCase.debugContext.debugIndex = 0;

                selenium.doSub("mysub1");

                Y.Assert.areSame(0, GosubControl.labels.mysub1.sub);
                Y.Assert.areSame(2, GosubControl.labels.mysub1.end);
                Y.Assert.areSame(3, GosubControl.labels.mysub2.sub);
                Y.Assert.areSame(4, GosubControl.labels.mysub2.end);
                areSameArray([], GosubControl.stack);

                Y.Assert.areSame(1, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 2;

                selenium.doEndsub("mysub1");

                areSameArray([], GosubControl.stack);
                Y.Assert.areSame(2, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 3;

                selenium.doSub("mysub2");

                areSameArray([], GosubControl.stack);
                Y.Assert.areSame(3, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 4;

                selenium.doEndsub("");

                areSameArray([], GosubControl.stack);
                Y.Assert.areSame(4, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 5;

                selenium.doGosub("mysub1");

                areSameArray([5], GosubControl.stack);
                Y.Assert.areSame(-1, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 0;

                selenium.doSub("mysub1");

                areSameArray([5], GosubControl.stack);
                Y.Assert.areSame(0, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 1;

                selenium.doGosub("mysub2");

                areSameArray([5,1], GosubControl.stack);
                Y.Assert.areSame(2, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 3;

                selenium.doSub("mysub1");

                areSameArray([5,1], GosubControl.stack);
                Y.Assert.areSame(3, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 4;

                selenium.doEndsub("");

                areSameArray([5], GosubControl.stack);
                Y.Assert.areSame(1, testCase.debugContext.debugIndex);

                //
                testCase.debugContext.debugIndex = 2;

                selenium.doEndsub("");

                areSameArray([], GosubControl.stack);
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
                delete selenium.gosub_initialize;

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
