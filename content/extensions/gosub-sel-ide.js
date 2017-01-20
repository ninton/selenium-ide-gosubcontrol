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

    var self = {};

    self.labels   = {};
    self.stack    = [];
    self.init_err = null;

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
        self.echo('gosubInit');

        self.labels   = {};
        self.stack    = [];
        self.init_err = null;

        try {
            self.initBody();
        } catch (e) {
            self.init_err = e;
        }
    };

    self.initBody = function () {
        var lbl = '',
            idx = -1,
            i,
            cmd;

        for (i = 0; i < testCase.commands.length; i += 1) {
            cmd = testCase.commands[i];

            if ('command' === cmd.type) {
                switch (cmd.command.toLowerCase()) {
                    case "sub":
                        if (lbl !== '') {
                            throw new Error('There is no "endsub" corresponding to "sub": line=' + i);
                        }
                        lbl = cmd.target;
                        idx = i;
                        if (lbl === '') {
                            throw new Error('A label of "sub" is a blank: line=' + i);
                        }
                        if (self.labels[lbl] !== undefined) {
                            throw new Error('A label of "sub" appears twice or more: line=' + i);
                        }
                        break;

                    case "endsub":
                        if (lbl === '') {
                            throw new Error('There is no "sub" corresponding to "endsub": line=' + i);
                        }
                        self.labels[lbl] = {sub: idx, end: i};
                        lbl = '';
                        idx = -1;
                        break;
                }
            }
        }
        if (lbl !== '') {
            throw new Error('There is no "endsub" corresponding to "sub": line=' + i);
        }
    };

    self.echo = function (i_mesg) {
        LOG.info(i_mesg);
    };

    self.gotoSub = function (i_label) {
        var idx;

        if (undefined === self.labels[i_label]) {
            throw new Error('"sub ' + i_label + '" is not found.');
        }

        idx = parseInt(self.labels[i_label].sub, 10) - 1;
        self.setIndex(idx);
        return idx;
    };

    self.gotoEndsub = function (i_label) {
        if (undefined === self.labels[i_label]) {
            throw new Error('"sub ' + i_label + '" is not found.');
        }

        var idx = parseInt(self.labels[i_label].end, 10) - 1;
        self.setIndex(idx);
        return idx;
    };

    self.setIndex = function (i_value) {
        if (undefined === i_value || null === i_value || i_value < 0) {
            throw new Error("Invalid index: index=" + i_value);
        }
        testCase.debugContext.debugIndex = i_value;
    };

    self.getIndex = function () {
        return testCase.debugContext.debugIndex;
    };

    self.debug = function () {
        self.echo('gosubDebug');

        Object.keys(self.labels).forEach(function(label) {
            self.echo("gosubDebug:sub|" + label + "|" + self.labels[label].sub + "|" + self.labels[label].end);
        });
    };

    self.doGosub = function (i_label) {
        if (self.init_err !== null) {
            throw self.init_err;
        }

        self.stack.push(self.getIndex());
        self.gotoSub(i_label);
    };

    self.doSub = function (i_label) {
        var idx;

        if (self.init_err !== null) {
            throw self.init_err;
        }

        if (0 === self.stack.length) {
            idx = self.gotoEndsub(i_label);
            self.echo("sub : fall down, skip to line=" +  idx);
        } else {
            self.echo("sub : from gosub");
        }
    };

    self.doEndsub = function () {
        var idx;

        if (self.init_err !== null) {
            throw self.init_err;
        }

        if (0 === self.stack.length) {
            self.echo("endsub : fall down");
        } else {
            idx = self.stack.pop();
            self.echo("endsub : goto line=" + idx);
            self.setIndex(idx);
        }
    };

    return self;
}

var GosubControl = new GosubControlClass();


Selenium.prototype.doGosubInit = function () {
    "use strict";
    GosubControl.init();
};

Selenium.prototype.doGosubDebug = function () {
    "use strict";
    GosubControl.initOnce(this);
    GosubControl.debug();
};

Selenium.prototype.doGosub = function (i_label) {
    "use strict";
    GosubControl.initOnce(this);
    GosubControl.doGosub(i_label);
};

Selenium.prototype.doSub = function (i_label) {
    "use strict";
    GosubControl.initOnce(this);
    GosubControl.doSub(i_label);
};

Selenium.prototype.doEndsub = function () {
    "use strict";
    GosubControl.initOnce(this);
    GosubControl.doEndsub();
};

Selenium.prototype.doReturn = function () {
    "use strict";
    GosubControl.initOnce(this);
    GosubControl.doEndsub();
};
