/*
    Orion: An XMPP-based multiplayer space game.
    Copyright (C) 2010 Lance Stout.
    This file is part of Orion.

    See the file LICENSE for copying permissions.
*/


// Add forEach() method to arrays for easier enumeration.
if(!Array.prototype.forEach) {
    Array.prototype.forEach = function(func) {
        /*
        Apply a function to every element in an array.

        Arguments:
            func  -- The function to apply.
            thisp -- Optional callback object.
        */
        var len = this.length;
        if(typeof func != "function") {
            throw new TypeError();
        }

        var thisp = arguments[1];
        for(var i = 0; i < len; i++) {
            if(i in this) {
                func.call(thisp, this[i], i, this);
            }
        }
    };
}

// Add remove() method to make deleting list items easier.
if(!Array.prototype.remove) { 
    Array.prototype.remove = function(el) { 
        /*
        Remove an element from an array.

        Arguments:
            el -- The object to remove.
        */
        var p = this.indexOf(el); 
        if (p>=0) { 
            this.splice(p, 1); 
        } 
    }; 
} 

