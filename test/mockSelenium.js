/*jslint white:true */
/*global YUI */

var Selenium = function () {
    "use strict";
    // Selenium is prototype constructor, not use { var self = {}; return self; }

    this.dummy = 1;
};

var testCase = {
    commands: [],
    debugContext: {
        debugIndex: 0
    }
};

var LOG = (function () {
    "use strict";

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
