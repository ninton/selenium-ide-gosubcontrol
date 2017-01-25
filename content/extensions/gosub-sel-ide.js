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

    this.log           = null;
    this.testCase      = testCase;
    this.subroutineMap = {};
    this.stack         = [];
}

GosubControlClass.prototype.init = function (log, testCase) {
    "use strict";
    this.log      = log;
    this.testCase = testCase;
    this.log.info('gosubInit');

    this.subroutineMap = {};
    this.stack         = [];

    this.makeSubroutineMap();
};

GosubControlClass.prototype.makeSubroutineMap = function () {
    "use strict";
    var self = this,
        params;

    params = {
        lbl: "",
        idx: -1
    };

    this.testCase.commands.forEach(function (cmd, i) {
        if ('command' !== cmd.type) {
            return;
        }

        switch (cmd.command.toLowerCase()) {
            case "sub":
                self.makeSub(params, i, cmd);
                break;

            case "endsub":
                self.makeEndsub(params, i);
                break;
        }
    });

    if (params.lbl !== '') {
        this.error('E05', 'There is no "endsub" corresponding to "sub": line=' + self.testCase.commands.length);
    }
};

GosubControlClass.prototype.makeSub = function (params, i, cmd) {
    "use strict";
    if (cmd.target === undefined || cmd.target === '') {
        this.error('E01', 'A label of "sub" is a blank: line=' + i);
    }

    if (this.subroutineMap[cmd.target] !== undefined) {
        this.error('E02', 'A label of "sub" appears twice or more: line=' + i);
    }

    if (params.lbl !== '') {
        this.error('E03', 'There is no "endsub" corresponding to "sub": line=' + i);
    }

    params.lbl = cmd.target;
    params.idx = i;
};

GosubControlClass.prototype.makeEndsub = function (params, i) {
    "use strict";
    if (params.lbl === '') {
        this.error('E04', 'There is no "sub" corresponding to "endsub": line=' + i);
    }
    this.subroutineMap[params.lbl] = {sub: params.idx, end: i};
    params.lbl = '';
    params.idx = -1;
};

GosubControlClass.prototype.error = function (errnum, mesg) {
    "use strict";
    var err;

    this.dump();

    err = new Error(mesg);
    err.errnum = errnum;
    throw err;
};

GosubControlClass.prototype.gotoSub = function (i_label) {
    "use strict";
    var idx;

    if (undefined === this.subroutineMap[i_label]) {
        this.error("E06", '"sub ' + i_label + '" is not found.');
    }

    idx = parseInt(this.subroutineMap[i_label].sub, 10) - 1;
    this.setIndex(idx);
    return idx;
};

GosubControlClass.prototype.gotoEndsub = function (i_label) {
    "use strict";
    var idx;

    if (undefined === this.subroutineMap[i_label]) {
        this.error("E07", '"sub ' + i_label + '" is not found.');
    }

    idx = parseInt(this.subroutineMap[i_label].end, 10) - 1;
    this.setIndex(idx);
    return idx;
};

GosubControlClass.prototype.setIndex = function (i_value) {
    "use strict";
    if (undefined === i_value || null === i_value || i_value < -1) {
        this.error("E08", "Invalid index: index=" + i_value);
    }
    this.testCase.debugContext.debugIndex = i_value;
};

GosubControlClass.prototype.getIndex = function () {
    "use strict";
    return this.testCase.debugContext.debugIndex;
};

GosubControlClass.prototype.dump = function () {
    "use strict";
    var self = this;

    Object.keys(this.subroutineMap).forEach(function(label) {
        self.log.info("labels:" + label + "|" + self.subroutineMap[label].sub + "|" + self.subroutineMap[label].end);
    });
    Object.keys(this.stack).forEach(function(index) {
        self.log.info("stack:" + index);
    });
};

GosubControlClass.prototype.doGosub = function (i_label) {
    "use strict";
    this.stack.push(this.getIndex());
    this.gotoSub(i_label);
};

GosubControlClass.prototype.doSub = function (i_label) {
    "use strict";
    var idx;

    if (0 === this.stack.length) {
        idx = this.gotoEndsub(i_label);
        this.log.info("sub : fall down, skip to line=" +  idx);
    } else {
        this.log.info("sub : from gosub");
    }
};

GosubControlClass.prototype.doEndsub = function () {
    "use strict";
    var idx;

    if (0 === this.stack.length) {
        this.log.info("endsub : fall down");
    } else {
        idx = this.stack.pop();
        this.log.info("endsub : goto line=" + idx);
        this.setIndex(idx);
    }
};

var gosubControl;


Selenium.prototype.doGosubInit = function () {
    "use strict";
    if (gosubControl === undefined) {
        gosubControl = new GosubControlClass();
    }
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
