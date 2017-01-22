/*jslint white:true*/
/*global */
"use strict";

var Selenium = function () {
};

var testCase = {
    commands: [],
    debugContext: {
        debugIndex: 0
    }
};

var LOG = (function () {
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
}());
