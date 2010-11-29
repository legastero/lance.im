/**
 * Canvas/game framework inspired by jsGameSoup.
 *
 * Rewritten to use jQuery, Point class, better key
 * handling, etc.
 */

var Point = function (x, y) {
    /**
     * A class representing a cartesian coordinate pair.
     *
     * Arguments:
     *     x -- The point's x-coordinate.
     *     y -- The point's y-coordinate.
     *   
     * Attributes:
     *     x -- The point's x-coordinate.
     *     y -- The point's y-coordinate.
     *
     * Methods:
     *     distance  -- Return the distance to another point.
     *     rotate    -- Rotate the point around the origin by a given angle.
     *     translate -- Move the point in the x and y directions.
     */
    this.x = x;
    this.y = y;

    this.distance = function (other) {
        /**
         * Return the distance to another point if given, or to
         * the origin.
         * 
         * Arguments:
         *     other -- Optional point object. The origin is assumed
         *              otherwise.
         */
        other = other || this.Point(0, 0);
        var x2 = Math.pow(this.x - other.x, 2);
        var y2 = Math.pow(this.y - other.y, 2);
        return Math.sqrt(x2 + y2);
    }

    this.rotate = function (angle) {
        /**
         * Rotate the point around the origin.
         *
         * Arguments:
         *     point -- A two element list containing the point's coordinates.
         *     angle -- The angle to rotate the point.
         */
        var rot_x = Math.cos(angle) * this.x - Math.sin(angle) * this.y;
        var rot_y = Math.sin(angle) * this.x + Math.cos(angle) * this.y;

        return new Point(rot_x, rot_y);
    }

    this.translate = function (dx, dy) {
        /**
         * Translate the point.
         *
         * Arguments:
         *     dx -- The distance to shift in the x-direction.
         *     dy -- The distance to shift in the y-direction.
        */
        return new Point(this.x + dx, this.y + dy);
    }
};


var Game = function (canvas, framerate) {
    /*
     * Arguments:
     *     canvas    -- Either the HTML canvas object itself, or the ID of
     *                  a canvas element, that will be used to render the
     *                  game.
     *     framerate -- The desired FPS rate which will be used to set
     *                  the game loop tick interval.
     *
     * Attributes:
     *     Game        -- Used to allow callbacks in handlers.
     *
     *     FRAME_RATE  -- The desired game speed in FPS. 
     *     HEIGHT      -- The height of the canvas.
     *     WIDTH       -- The width of the canvas.
     *
     *     canvas      -- The HTML canvas rendering the game.
     *     ctx         -- The 2d drawing context of the canvas.
     *     eventQueue  -- The list of events to process during a main loop
     *                    cycle.
     *   
     *     objects     -- A dictionary of lists containing all of the 
     *                    game objects. The entity categories are:
     *                       * all        -- All objects.
     *                       * drawable   -- Objects with a draw() method.
     *                       * updateable -- Objects with an update() method.
     *                       * add        -- Objects to be added to the game.
     *                       * remove     -- Objects to remove from the game.
     *                   
     *     mouseListeners -- A collection of lists mapping objects 
     *                       with mouse events.
     *     keyListeners   -- A collection of dictionaries of lists mapping
     *                       objects with keyboard events.
     *     keysHeld       -- A dictionary of keys that are being pressed.
     *
     *  Methods:
     *      random        --
     *
     *      setBackground -- 
     *      drawPolygon   --
     *      drawPolyline  --
     *      clear         --
     *
     *      addObject     --
     *      delObject     --
     *
     *      init          --
     *      update        --
     *
     *   Event Handlers:
     *      keyDown       --
     *      keyUp         --
     *      mouseDown     --
     *      mouseUp       --
     *      mouseMove     --
     */
    this.canvas = canvas; 
    this.ctx = this.canvas.getContext('2d');
    this.eventQueue = [];
    this.objects = {
        all: [],
        updateable: [],
        drawable: [],
        add: [],
        remove: []
    };
    this.mouseListeners = {
        mouseDown_Right: [],
        mouseDown_Left: [],
        mouseUp_Right: [],
        mouseUp_Left: [],
        mouseMove: []
    };
    this.keyListeners = {
        keyHeld: {},
        keyDown: {},   
        keyUp: {}
    };   
    this.keysHeld = {};
            
    this.FRAME_RATE = framerate;
    this.HEIGHT = parseInt(this.canvas.height); 
    this.WIDTH = parseInt(this.canvas.width);
    this.KEYS = {
         8: "Backspace",  9: "Tab",       13: "Enter",     16: "Shift",    
        17: "Ctrl",      18: "Alt",       20: "CapsLock",  27: "Escape",    
        32: "Space",     33: "PageUp",    34: "PageDown",  35: "End",
        36: "Home",      37: "LeftArrow", 38: "UpArrow",   39: "RightArrow",
        40: "DownArrow", 45: "Insert",    46: "Delete",    48: "0",
        49: "1",         50: "2",         51: "3",         52: "4",
        53: "5",         54: "6",         55: "7",         56: "8",
        57: "9",         65: "A",         66: "B",         67: "C",
        68: "D",         69: "E",         70: "F",         71: "G",
        72: "H",         73: "I",         74: "J",         75: "K",
        76: "L",         77: "M",         78: "N",         79: "O",
        80: "P",         81: "Q",         82: "R",         83: "S",
        84: "T",         85: "U",         86: "V",         87: "W",
        88: "X",         89: "Y",         90: "Z",        144: "NumLock",
        145: "ScrollLock",   186: "SemiColon",    187: "Equals",
        188: "Comma",        189: "Dash",         190: "Period",
        191: "ForwardSlash", 192: "GraveAccent",  219: "OpenBracket",
        220: "BackSlash",    221: "CloseBracket", 222: "SingleQuote"
    };

    // Map distances to pixel values; allows for easier scaling.
    this.METERS = 1;
    this.KILOMETERS = this.METERS * 1000;

    this.Game = this;
    this.Point = Point;

    // Shift the canvas' coordinate system so that 1px lines drawn
    // along integer value coordinates remain 1px wide instead of
    // becoming 2px wide.
    this.ctx.translate(0.5, 0.5);

    // ================================================================
    // Math Utilities
    // ================================================================

    this.random = function (lower, upper) {
        /**
         * Return a random, real value within a given interval.
         *
         * Arguments:
         *     lower -- The lower bound of the interval. Defaults to 0. 
         *     upper -- The upper bound of the interval. Defaults to 1.
         */
        lower = lower || 0;
        upper = upper || 1;
 
        return Math.random() * (upper - lower) + lower;
    }

    // ================================================================
    // Graphics
    // ================================================================
    
    this.setScale = function(meter) {
        /**
         * Set the scale for converting in-game meters to pixel counts.
         *
         * Arguments:
         *     meter -- The new length of an in-game meter in pixels.
         */
        this.METERS = meter;
        this.KILOMETERS = this.METER * 1000;
    }

    this.clear = function() {
        /* Remove the canvas' contents. */
        this.ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
    }

    this.setBackground = function (color) {
        /** 
         * Set the canvas' background color. 
         *
         * Arguments:
         *     color -- A color name, or rgb expression.
         */
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        this.ctx.restore();
    }

    this.drawPolygon = function (vertices) {
        /**
         * Draw a polyon.
         * 
         * Arguments:
         *     vertices -- A list of points representing the
         *                 vertices of the polygon.
         */
        this.ctx.save();
        this.ctx.beginPath();

        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        for (var i = 0; i < vertices.length; i++) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        this.ctx.lineTo(vertices[0].x, vertices[0].y);

        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
        this.ctx.restore();
    }

    this.drawPolyline = function (vertices) {
        /**
         * Draw a polyline.
         * 
         * Arguments -- A list of coordinate pairs representing the
         *              vertices of the polyline.
         */
        this.ctx.save();
        this.ctx.beginPath();

        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        for (var i = 0; i < vertices.length; i++) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }

        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
        this.ctx.restore();
    }

    // ================================================================
    // Object Management
    // ================================================================

    this.addObject = function (obj) {
        /**
         * Mark an object to be added during the next cycle of the
         * game loop.
         */
        this.objects['add'].push(obj);
    }

    this.delObject = function (obj) {
        /**
         * Mark an object to be removed during the next cycle of the
         * game loop.
         * 
         * Arguments:
         *     obj -- The object to remove.
         */
        this.objects['remove'].push(obj);
    }

    this.knownObject = function (obj) {
        /** 
         * Check if an object has been registered with the game.
         */
        return (this.objects.all.indexOf(obj) >= 0);
    }

    this._categorizeObject = function (obj) {
        /**
         * Place a game object into the appropriate object categories to
         * make processing faster during the main loop.
         *
         * Arguments:
         *     obj -- The object to add to the category lists.
         */

        if(this.objects['all'].indexOf(obj) >= 0) {
            // The object has already been catagorized.
            return;
        }

        // Detect the object's categories.

        var category_map = {
            'update': 'updateable',
            'draw': 'drawable'
        }

        this.objects['all'].push(obj);

        for(var method in category_map) {
            var category = category_map[method];

            if(obj[method]) {
                this.objects[category].push(obj);
            }
        }

        this._detectEventHandlers(obj);
    }

    this._clearObject = function (obj) {
        /**
         * Remove an object from all categories, and thus from the game.
         * 
         * Arguments:
         *     obj -- The object to remove from the game.
         */
        for(var category in this.objects) {
            this.objects[category].remove(obj);
        }
    }

    // ================================================================
    // Event Management 
    // ================================================================

    this.sendEvent = function (obj, handler, args) {
        /**
         * Queue an event notice to send to an object during the next
         * game loop update.
         *
         * Arguments:
         *     obj     -- The object to receive the event.
         *     handler -- The name of the object's method to handle the event.
         *     args    -- The event data.
         */
        this.eventQueue.push([obj, handler, args]);
    }

    this.broadcastEvent = function (objs, handler, args) {
        /**
         * Queue an event notice to send to an object during the next
         * game loop update.
         *
         * Arguments:
         *     objs    -- A list of objects to receive the event.
         *     handler -- The name of the object's method to handle the event.
         *     args    -- The event data.
         */
        if(objs === undefined)
            return
        if(objs.length == 0)
            return
        objs.forEach(function (obj) {
            this.eventQueue.push([obj, handler, args]);
        }, this);
    }
    
    this._detectEventHandlers = function (obj) {
        /**
         * Detect the event handlers supported by the object so that
         * it can be mapped with its events.
         *
         * Arguments:
         *     obj -- The object to map with events.
         */
        for(var method in obj) {
            var names = method.split("_");
            // Detect any mouse event handlers.
            
            // Detect any keyboard handlers.
            ['keyHeld', 'keyDown', 'keyUp'].forEach(function (eventType) {
                if(names[0] == eventType) {
                    eventName = this._extractKeyEvent(names, eventType);
                    if(!this.keyListeners[eventType][eventName]) {
                        this.keyListeners[eventType][eventName] = [];
                    }
                    this.keyListeners[eventType][eventName].push(obj);
                }
            }, this);
        }
    }
    
    this._extractKeyEvent = function (names, eventType) {
        /**
         * Convert method names of the form:
         *     keyHeld_Ctrl_Shift_A
         * to event names of the form:
         *     CS_A
         * 
         * Methods that do not respond to modifier keys will have events
         * that start with "_".
         * 
         * A method that accepts all keys will map to only "_".
         *
         * Arguments:
         *     names     -- A list of identifiers in the original method 
         *                  name, such as "Ctrl", "Alt", "33", etc.
         *     eventType -- The event type, such as "keyDown".
         */
        names.remove(eventType);
        var eventName = "";
        if(names.indexOf("Ctrl") >= 0) {
            eventName += "Ctrl_";
            names.remove("Ctrl");
        }
        if(names.indexOf("Alt") >= 0) {
            eventName += "Alt_";
            names.remove("Alt");
        }
        if(names.indexOf("Shift") >= 0) {
            eventName += "Shift_";
            names.remove("Shift");
        }
        if(names.length > 0) {
            eventName += names[0];
        }
        return eventName;
    }

    this._eventKeyName = function (ev) {
        /**
         * Extract the key name from a keyboard input event.
         *
         * Arguments:
         *     ev -- The keyboard input event object.
         */
        var keyName = "";
        if(ev.ctrlKey)
            keyName += "Ctrl_";
        if(ev.altKey)
            keyName += "Alt_";
        if(ev.shiftKey)
            keyName += "Shift_";
        keyName += this.KEYS[ev.keyCode? ev.keyCode: ev.charCode];

        return keyName;
    }

    // ================================================================
    // Input Event Handlers
    // ================================================================

    this.keyDown = function () {
        var game = this;
        return function (ev) {
            /**
             * Listen for key down events.
             *
             * Arguments:
             *     ev -- The key press event object.
             */
            var key = game._eventKeyName(ev);
            var method = 'keyDown_' + key;
            if(!game.keyListeners['keyDown'][key])
                return

            if(game.keyListeners['keyDown'][key].length == 0)
                return

            if(!game.keysHeld[key]) {
                game.keysHeld[key] = true;
                game.broadcastEvent(game.keyListeners['keyDown'][key], method);
            }

            ev.stopPropagation();
            return false;
        }
    }

    this.keyUp = function (ev) {
        var game = this;
        return function (ev) {
            /**
             * Listen for key up events.
             * 
             * Arguments:
             *     ev -- The key release event object.
             */
            var key = game._eventKeyName(ev);
            var method = 'keyUp_' + key;
       
            if(game.keysHeld[key]) { 
                game.keysHeld[key] = false;
                game.broadcastEvent(game.keyListeners['keyUp'][key], method);
            }
            ev.stopPropagation();
            console.log("Key Up: " + key);
            return false;
        }
    }

    this.mouseMove = function (ev) {
        var game = this;
        return function (ev) {
            /**
             * Listen for mouse movement events.
             *
             * Arguments:
             *     ev -- The mouse move event object.
             */
        }
    }

    this.mouseDown = function (ev) {
        var game = this;
        return function (ev) {
            /** 
             * Listen for mouse press events.
             *
             * Arguments:
             *     ev -- The mouse press object.
             */
        }
    }
    
    this.mouseUp = function (ev) {
        var game = this;
        return function (ev) {
            /** 
             * Listen for mouse release events.
             *
             * Arguments:
             *     ev -- The mouse button release object.
             */
        }
    }

    // ================================================================
    // Main Game Loop
    // ================================================================

    this.update = function () {
        /**
         * Update the game's state. 
         *
         * The process is to:
         *     1. Remove any deleted objects.
         *     2. Add any new objects.
         *     3. Update all updateable objects.
         *     4. Process queued events.
         *     5. Clear screen.
         *     6. Draw all drawable objects.
         */

        // Remove deleted objects.
        this.objects.remove.forEach(this._clearObject, this);
        this.objects.remove = [];

        // Add new objects.
        this.objects.add.forEach(this._categorizeObject, this);
        this.objects.add = [];

        // Update objects.
        this.objects.updateable.forEach(function (obj) {
            obj.update(this);
        }, this);

        // Process events.
        this.eventQueue.forEach(function (ev) {
            var obj = ev[0];
            var method = ev[1];
            var args = ev[2];

            obj[method](args);
        }, this);
        this.eventQueue = [];

        // Issue keyHeld events.
        for(var key in this.keysHeld) {
            if(this.keysHeld[key]) {
                var method = 'keyHeld_' + key;
                if(!this.keyListeners.keyHeld)
                    break;
                if(this.keyListeners.keyHeld.length == 0)
                    break;
                console.log('Key Held: ' + key);
                this.broadcastEvent(this.keyListeners.keyHeld[key], method);
            }
        }

        // Draw new screen.
        this.clear();
        this.objects.drawable.forEach(function (obj) {
            this.ctx.save();
            obj.draw(this.ctx, this);
            this.ctx.restore();
        }, this);
    }

    // ================================================================
    // Startup
    // ================================================================

    this.init = function () {
        /**
         * Register event listeners and start the game's main loop.
         */
        var game = this;

        $(document).keydown(game.keyDown());
        $(document).keyup(game.keyUp());
        $(game.canvas).mousedown(game.mouseDown());
        $(game.canvas).mouseup(game.mouseUp());
        $(game.canvas).mousedown(game.mouseDown());
        $(game.canvas).bind("contextmenu", function () { return false; });

        var loop = setInterval(function() {
            try {
                game.update();
            }
            catch(error) {
                clearInterval(loop);
                throw(error);
            }
        }, 1000 / game.FRAME_RATE);
    }
};


// ====================================================================
// Find and launch games.
// ====================================================================

function launchGame(canvas) {
    /**
     * Initialize a game using the given canvas.
     *
     * The default FPS rate is 15 frames per second.
     * 
     * Arguments:
     *     canvas - A jQuery wrapped canvas element that will host the game. 
     *              The canvas must have a data-game attribute, and 
     *              optionally a data-fps attribute.
     */
    var canvas = $(canvas);
    var game_def = canvas.attr('data-game');
    var fps = parseInt(canvas.attr('data-fps')) || 45;
    
    if(game_def === undefined) {
        // No game definition, so we can't load a game to play.
        return;
    }
    
    var game = new Game(canvas[0], fps);
    this[game_def](game);
    game.init();
    return game;    
}
