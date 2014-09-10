# Selenium IDE: Gosub Control

Adds "gosub", "sub" and "endsub" commands to Selenium IDE.

## Lincense

Mozilla Public License - https://www.mozilla.org/MPL/

## Requirements

* Selenium IDE 1.0.5 or later
 
To build on Windows you will need 7-Zip and Robocopy:

* 7-Zip - http://www.7-zip.org/
* Robocopy - http://en.wikipedia.org/wiki/Robocopy

## Installation

From AMO:

* Open https://addons.mozilla.org/ja/firefox/addon/selenium-ide-gosub-control/
* Click 'Add to Firefox'

From source:

* Run build.bat (or build.sh on Linux).
* Open gosubcontrol.xpi in Firefox.

## Documentation

### Commands

* gosub - goto subroutine
* sub - subroutine start
* endsub - subroutine end and return
* gosubDebug - show list of the labels of "sub"
* return - return
* gosubInit - It is due to abolish

### Examples

See also demos folder.

#### The extract of an actual test case. 

    gosub reset_failed_logins　　
    gosub login_miss_pw　　
    gosub get_failed_logins　　
    verifyExpression ${FAILED_LOGINS} 1　　
    　　
    sub login_miss_pw　　
    open http://user-site//login　　
    waitForPageToLoad　　
    type name=username test_user　　
    type name=password　　
    clickAndWait id=btnLogin　　
    assertLocation http://user-site//login　　
    endsub　　
    　　
    sub reset_failed_logins　　
    \#login admin site　　
    \#find test_user　　
    \#click security tab　　
    \#reset "failed logins"　　
    \#logout　　
    endsub　　
    　　
    sub get_failed_logins　　
    \#login admin site　　
    \#find test_user　　
    \#click security tab　　
    \#store "failed logins"　　
    \#logout　　
    endsub　　

## Credits

* Aoki Makoto, Ninton G.K.

### Reference

Selenium IDE: Flow Control
author: Author: Dave Hunt
https://github.com/davehunt/selenium-ide-flowcontrol
https://addons.mozilla.org/ja/firefox/addon/flow-control/

