/**
 * gosub-sel-ide.js
 * A gosub control plugin for Selenium-IDE
 * Copyright 2014-, Aoki Makoto, Ninton G.K. http://www.ninton.co.jp
 * Released under the Mozilla Public License - https://www.mozilla.org/MPL/
 * 
 * It referred to Selenium IDE: Flow Control
 */
function GosubControlClass() {
	this.labels = {};
	this.stack = [];
	this.init_err = null;
	
	this.init = function () {
		this.echo( 'gosubInit' );
		
	    this.labels = {};
		this.stack = [];
		this.init_err = null;
		
		try {
			this._init();
		} catch (e) {
			this.init_err = e;
		}
	};
	
	this._init = function () {
	    var lbl = '';
	    var idx = -1;
	    
	    for( var i = 0; i < testCase.commands.length; i++ ) {
	    	var cmd = testCase.commands[i];
	    	
	        if (cmd.type == 'command')
	        switch( cmd.command.toLowerCase() ) {
	            case "sub":
	            	if ( lbl != '' ) {
	            		throw new Error( "endsub not found: line=" + i );
	            	}
	            	lbl = cmd.target;
	            	idx = i;
	            	if ( lbl == '' ) {
	            		throw new Error( "sub label is empty: line=" + i );
	            	}
	            	if ( typeof this.labels[lbl] != 'undefined' ) {
	            		throw new Error( "sub label is duplicated: line=" + i );
	            	}
	            	break;
	            	
	            case "endsub":
	            	if ( lbl == '' ) {
	            		throw new Error( "sub not found: line=" + i );
	            	}
	            	this.labels[lbl] = {sub:idx, end:i};
	            	lbl = '';
	            	idx = -1;
	                break;
	        }
	    }
		if ( lbl != '' ) {
			throw new Error( "endsub not found: line=" + i );
		}
	};

	this.echo = function ( i_mesg ) {
		LOG.info( i_mesg );
	};
	
	this.gotoSub = function ( i_label ) {
	    if ( undefined == this.labels[i_label] ) {
	        throw new Error( "sub '" + i_label + "' is not found." );
	    }

		var idx = parseInt(this.labels[i_label].sub) - 1;
		this.setIndex( idx );
		return idx;
	};

	this.gotoEndsub = function ( i_label ) {
	    if ( undefined == this.labels[i_label] ) {
	        throw new Error( "sub '" + i_label + "' is not found." );
	    }

		var idx = parseInt(this.labels[i_label].end) - 1;
		this.setIndex( idx );
		return idx;
	};
	
	this.setIndex = function ( i_value ) {
	    if (undefined == i_value || null == i_value || i_value < 0) {
	        throw new Error( "Invalid index." );
	    }
	    testCase.debugContext.debugIndex = i_value;		
	};
	
	this.getIndex = function () {
		return testCase.debugContext.debugIndex;
	};
	
	this.debug = function () {
		this.echo( 'gosubDebug' );
		
		for ( var label in this.labels ) {
			this.echo( "gosubDebug:sub|" + label + "|" + this.labels[label].sub + "|" + + this.labels[label].end);
		}
	};
	
	this.doGosub = function ( i_label ) {
		if ( this.init_err != null ) {
			throw this.init_err;
		}
		
		this.stack.push( this.getIndex() );
		this.gotoSub( i_label );
	};
	
	this.doSub = function ( i_label ) {
		if ( this.init_err != null ) {
			throw this.init_err;
		}
		
		if ( 0 == this.stack.length ) {
			var idx = this.gotoEndsub( i_label );
			this.echo( "sub : fall down, skip to line=" +  idx );
		} else {
			this.echo( "sub : from gosub" );
		}
	};
	
	this.doEndsub = function () {
		if ( this.init_err != null ) {
			throw this.init_err;
		}
		
		if ( 0 == this.stack.length ) {
			this.echo( "endsub : fall down" );
		} else {
			var idx = this.stack.pop();
			this.echo( "endsub : goto line=" + idx );
			this.setIndex( idx );
		}
	};
}

var GosubControl = new GosubControlClass();

Selenium.prototype.reset = function() {
	//overload the original Selenium reset function
	this.doGosubInit();
	
    // proceed with original reset code
    this.defaultTimeout = Selenium.DEFAULT_TIMEOUT;
    this.browserbot.selectWindow("null");
    this.browserbot.resetPopups();
}

Selenium.prototype.doGosubInit = function() {
	LOG.info( 'gosubInit' );
	GosubControl.init();
}

Selenium.prototype.doGosubDebug = function() {
	GosubControl.debug();
}

Selenium.prototype.doGosub = function( i_label ) {
	GosubControl.doGosub( i_label );
}

Selenium.prototype.doSub = function( i_label ) {
	GosubControl.doSub( i_label );
}

Selenium.prototype.doEndsub = function() {
	GosubControl.doEndsub();	
}

Selenium.prototype.doReturn = function() {
	GosubControl.doEndsub();
}
