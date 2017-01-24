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
    self.log    = null;
    self.labels = {};
    self.stack  = [];

    self.initOnce = function (io_selenium) {
        // issue #2: If "Flow Control" is installed, this cannot be initialized correctly
        // [MEMO] htmlTestRunner.metrics.startTime is undefined.
        // [MEMO] testCase.lastModifiedTime is same as testCase.file.lastModifiedTime.
        if (io_selenium.gosub_initialized !== undefined) {
            return;
        }

        self.init();
        io_selenium.gosub_initialized = true;
    };

    self.init = function () {
        self.log.info('gosubInit');

        self.labels   = {};
        self.stack    = [];

        self.initBody();
    };

    self.initBody = function () {
        var lbl = '',
            idx = -1;

        testCase.commands.forEach(function (cmd, i) {
            if ('command' !== cmd.type) {
                return;
            }

            switch (cmd.command.toLowerCase()) {
                case "sub":
                    if (cmd.target === undefined || cmd.target === '') {
                        self.error('E01', 'A label of "sub" is a blank: line=' + i);
                    }

                    if (self.labels[cmd.target] !== undefined) {
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
                    self.labels[lbl] = {sub: idx, end: i};
                    lbl = '';
                    idx = -1;
                    break;
            }
        });
        
        if (lbl !== '') {
            self.error('E05', 'There is no "endsub" corresponding to "sub": line=' + testCase.commands.length);
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

        if (undefined === self.labels[i_label]) {
            self.error("E06", '"sub ' + i_label + '" is not found.');
        }

        idx = parseInt(self.labels[i_label].sub, 10) - 1;
        self.setIndex(idx);
        return idx;
    };

    self.gotoEndsub = function (i_label) {
        var idx;

        if (undefined === self.labels[i_label]) {
            self.error("E07", '"sub ' + i_label + '" is not found.');
        }

        idx = parseInt(self.labels[i_label].end, 10) - 1;
        self.setIndex(idx);
        return idx;
    };

    self.setIndex = function (i_value) {
        if (undefined === i_value || null === i_value || i_value < -1) {
            self.error("E08", "Invalid index: index=" + i_value);
        }
        testCase.debugContext.debugIndex = i_value;
    };

    self.getIndex = function () {
        return testCase.debugContext.debugIndex;
    };

    self.dump = function () {
        Object.keys(self.labels).forEach(function(label) {
            self.log.info("labels:" + label + "|" + self.labels[label].sub + "|" + self.labels[label].end);
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

var GosubControl = new GosubControlClass();


Selenium.prototype.doGosubInit = function () {
    "use strict";
    GosubControl.setLog(LOG);
    GosubControl.init();
};

Selenium.prototype.doGosubDebug = function () {
    "use strict";
    GosubControl.setLog(LOG);
    GosubControl.dump();
};

Selenium.prototype.doGosub = function (i_label) {
    "use strict";
    GosubControl.setLog(LOG);
    GosubControl.initOnce(this);
    GosubControl.doGosub(i_label);
};

Selenium.prototype.doSub = function (i_label) {
    "use strict";
    GosubControl.setLog(LOG);
    GosubControl.initOnce(this);
    GosubControl.doSub(i_label);
};

Selenium.prototype.doEndsub = function () {
    "use strict";
    GosubControl.setLog(LOG);
    GosubControl.initOnce(this);
    GosubControl.doEndsub();
};

Selenium.prototype.doReturn = function () {
    "use strict";
    GosubControl.setLog(LOG);
    GosubControl.initOnce(this);
    GosubControl.doEndsub();
};
