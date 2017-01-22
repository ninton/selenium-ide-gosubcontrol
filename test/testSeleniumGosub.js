/*jslint white:true*/
/*global YUI, InitTabsScrollLeft, InitPageHeight*/
"use strict";

YUI({logInclude: {TestRunner: true}}).use("test", "console", "test-console", "phantomjs",
    function(Y) {
        var MockLOG = function () {
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
        
        var areSameArray = function (expected, actual) {
            Y.Assert.areSame(expected.length, actual.length);
            expected.forEach(function(value, i) {
                Y.Assert.areSame(value, actual[i]);
            });
        };
    
        var areSameObject = function (expected, actual) {
            Object.keys(expected).forEach(function(key, i) {
                if (!expected.hasOwnProperty(key)) {
                    return;
                }
                
                var value = expected[key];
                
                if (typeof value !== "object") {
                    Y.Assert.areSame(value, actual[key]);
                } else {
                    if (value.length === undefined) {
                        areSameObject(value, actual[key]);                            
                    } else {
                        areSameArray(value, actual[key]);
                    }
                }
            });
        };
    
        Y.Test.Runner.add(new Y.Test.Case({
            name: "echo",
            "testEcho": function() {
                
                LOG = new MockLOG();
                
                GosubControl.log.info("Abc");
                GosubControl.log.info("xYz");
                
                Y.Assert.areSame(2, LOG.infoMessages.length);
                Y.Assert.areSame("Abc", LOG.infoMessages[0]);
                Y.Assert.areSame("xYz", LOG.infoMessages[1]);
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
                        setIndex: -1,
                        expected: {
                            index: 1,
                            errnum: "E08"
                        }
                    },
                    {
                        index: 2,
                        setIndex: null,
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
                    LOG = new MockLOG();
                    var selenium = new Selenium();
                    
                    if (data.initialized) {
                        selenium.gosub_initialized = data.initialized;
                    }
                    
                    GosubControl.initOnce(selenium);
                    
                    Y.Assert.areSame(true, selenium.gosub_initialized);
                    areSameArray(data.expected.messages, LOG.infoMessages);
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

                testData.forEach(function(data, i) {
                    LOG = new MockLOG();
                    var selenium = new Selenium();
                    delete selenium.gosub_initialize;
                    
                    testCase.commands = data.commands;
                    
                    GosubControl.init();
                    
                    areSameObject(data.expected.labels, GosubControl.labels);
                    areSameArray(data.expected.messages, LOG.infoMessages);
                });
            }
        }));

        var testInit_Error = function(data, i) {
            var selenium,
                errnum;
        
            LOG = new MockLOG();
            selenium = new Selenium();
            delete selenium.gosub_initialize;
        
            testCase.commands = data.commands;
        
            try {
                GosubControl.init();
            } catch (e) {
                errnum = e.errnum;
            }
        
            Y.Assert.areSame(data.expected.errnum, errnum);
        };
        
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
                            {type: "command" , command: "sub", target: "mysub1"},
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
                            {type: "command" , command: "endsub"},
                        ],
                        expected: {
                            errnum: "E04"
                        }
                    },
                    {
                        commands: [
                            {type: "command" , command: "sub", target: "mysub1"},
                            {type: "command" , command: "endsub"},
                            {type: "command" , command: "endsub"},
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
                            {type: "command" , command: "sub", target: "mysub1"},
                        ],
                        expected: {
                            errnum: "E05"
                        }
                    },
                    {
                        commands: [
                            {type: "command" , command: "sub", target: "mysub1"},
                            {type: "command" , command: "endsub"},
                            {type: "command" , command: "sub", target: "mysub2"},
                        ],
                        expected: {
                            errnum: "E05"
                        }
                    },
                ];

                testData.forEach(testInit_Error);
            }
        }));
        
        (new Y.Test.Console({newestOnTop:false})).render("#log");
        Y.Test.Runner.run();
    }
);
