/*jslint white: true */
/*global Selenium, testCase, LOG*/
/**
 * gosub-sel-ide.js
 * A gosub control plugin for Selenium-IDE
 * Copyright 2014-, Aoki Makoto, Ninton G.K. http://www.ninton.co.jp
 * Released under the Mozilla Public License - https://www.mozilla.org/MPL/
 * 
 * It referred to Selenium IDE: Flow Control
 */
function GosubControlClass() {
    "use strict";

    function MyError (errnum, message) {
        var err = new Error(message);
        err.errnum = errnum;
        return err;
    }

    var self = {};
    self.log      = null;
    self.testCase = null;
    self.subroutineMap   = {};
    self.stack    = [];

    self.init = function (log, testCase) {
        self.log = log;
        self.log.info('gosubInit');

        self.testCase = testCase;
        self.subroutineMap   = {};
        self.stack    = [];

        self.initBody();
    };

    self.initBody = function () {
        var lbl = '',
            idx = -1;

        self.testCase.commands.forEach(function (cmd, i) {
            if ('command' !== cmd.type) {
                return;
            }

            switch (cmd.command.toLowerCase()) {
                case "sub":
                    if (cmd.target === undefined || cmd.target === '') {
                        self.error('E01', 'A label of "sub" is a blank: line=' + i);
                    }

                    if (self.subroutineMap[cmd.target] !== undefined) {
                        self.error('E02', 'A label of "sub" appears twice or more: line=' + i);
                    }

                    if (lbl !== '') {
                        self.error('E03', 'There is no "endsub" corresponding to "sub": line=' + i);
                    }

                    lbl = cmd.target;
                    idx = i;
                    break;

                case "endsub":
                    if (lbl === '') {
                        self.error('E04', 'There is no "sub" corresponding to "endsub": line=' + i);
                    }
                    self.subroutineMap[lbl] = {sub: idx, end: i};
                    lbl = '';
                    idx = -1;
                    break;
            }
        });
        
        if (lbl !== '') {
            self.error('E05', 'There is no "endsub" corresponding to "sub": line=' + self.testCase.commands.length);
        }
    };

    self.setLog = function (log) {
        self.log = log;
    };

    self.error = function (errnum, mesg) {
        self.dump();

        throw new MyError(errnum, mesg);
    };

    self.gotoSub = function (i_label) {
        var idx;

        if (undefined === self.subroutineMap[i_label]) {
            self.error("E06", '"sub ' + i_label + '" is not found.');
        }

        idx = parseInt(self.subroutineMap[i_label].sub, 10) - 1;
        self.setIndex(idx);
        return idx;
    };

    self.gotoEndsub = function (i_label) {
        var idx;

        if (undefined === self.subroutineMap[i_label]) {
            self.error("E07", '"sub ' + i_label + '" is not found.');
        }

        idx = parseInt(self.subroutineMap[i_label].end, 10) - 1;
        self.setIndex(idx);
        return idx;
    };

    self.setIndex = function (i_value) {
        if (undefined === i_value || null === i_value || i_value < -1) {
            self.error("E08", "Invalid index: index=" + i_value);
        }
        self.testCase.debugContext.debugIndex = i_value;
    };

    self.getIndex = function () {
        return self.testCase.debugContext.debugIndex;
    };

    self.dump = function () {
        Object.keys(self.subroutineMap).forEach(function(label) {
            self.log.info("labels:" + label + "|" + self.subroutineMap[label].sub + "|" + self.subroutineMap[label].end);
        });
        Object.keys(self.stack).forEach(function(index) {
            self.log.info("stack:" + index);
        });
    };

    self.doGosub = function (i_label) {
        self.stack.push(self.getIndex());
        self.gotoSub(i_label);
    };

    self.doSub = function (i_label) {
        var idx;

        if (0 === self.stack.length) {
            idx = self.gotoEndsub(i_label);
            self.log.info("sub : fall down, skip to line=" +  idx);
        } else {
            self.log.info("sub : from gosub");
        }
    };

    self.doEndsub = function () {
        var idx;

        if (0 === self.stack.length) {
            self.log.info("endsub : fall down");
        } else {
            idx = self.stack.pop();
            self.log.info("endsub : goto line=" + idx);
            self.setIndex(idx);
        }
    };

    return self;
}

var gosubControl = new GosubControlClass();


Selenium.prototype.doGosubInit = function () {
    "use strict";
    if (this.gosubController === undefined) {
        this.gosubController = gosubControl;
        this.gosubController.init(LOG, testCase);
    }
};

Selenium.prototype.doGosubDebug = function () {
    "use strict";
    this.doGosubInit();
    this.gosubController.dump();
};

Selenium.prototype.doGosub = function (label) {
    "use strict";
    this.doGosubInit();
    this.gosubController.doGosub(label);
};

Selenium.prototype.doSub = function (label) {
    "use strict";
    this.doGosubInit();
    this.gosubController.doSub(label);
};

Selenium.prototype.doEndsub = function () {
    "use strict";
    this.doGosubInit();
    this.gosubController.doEndsub();
};

Selenium.prototype.doReturn = function () {
    "use strict";
    this.doGosubInit();
    this.gosubController.doEndsub();
};
