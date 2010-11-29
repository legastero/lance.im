function startOrion(gs) {
	/*** Define some different types of things ***/
	t_ship = 1;
	t_asteroid = 2;

    gs.setScale(1);
	
	/*** reload the game ***/
	function doReload(secs) {
		setTimeout(function() {window.location.href = unescape(window.location.pathname);}, 1000 * secs);
	}
	
	/*** A single asteroid ***/
	function Asteroid(world, data, asteroidScale, quadrant) {
		this.type = t_asteroid;
		this.world = world;
		// get variables from the incoming data
		this.id = data.id
        this.loc = new Point((data.x + quadrant[0]) * gs.WIDTH,
                             (data.y + quadrant[1]) * gs.HEIGHT);
		this.angle = data.angle;
		this.radius = 100 * asteroidScale + 30;
		this.quadrant = quadrant;
		this.strokeStyle = 'rgba(255, 255, 255, 1.0)';
		this.fillStyle = 'rgba(115, 115, 115, 1.0)';
		
		// structure of this shape
		this.points = [];
        this.poly = [];
		for (p=0; p< data.points.length; p++) {
            var point = new Point(this.radius * data.points[p].x, 
                                  this.radius * data.points[p].y);
		    this.points.push(point.rotate(this.angle));
        }

		this.update = function() {
			// update our shape definition
			for (n=0; n<this.points.length; n++) {
                this.poly[n] = this.points[n].translate(-this.world.cameraX(), -this.world.cameraY());
			}
		}
		
		this.draw = function(c) {
			c.strokeStyle = this.strokeStyle;
			c.fillStyle = this.fillStyle;
			gs.drawPolygon(this.poly);
		}
	}
	
	/*** A background parallax star ***/
	function Star(world) {
		this.world = world;
		this.rate = gs.random(0.5, 1.0);
		this.size = Math.round(gs.random(0, 3));
		this.x = gs.random(0, 10000);
		this.y = gs.random(0, 10000);
		this.fs = 'rgba(255, 255, 255, ' + (this.rate - 0.2) + ')';
		
		this.update = function() {
		}
		
		this.getX = function() {
			return Math.round((this.x - this.world.cameraX()) * this.rate % gs.WIDTH);
		}
		
		this.getY = function() {
			return Math.round((this.y - this.world.cameraY()) * this.rate % gs.HEIGHT);
		}
		
		if (this.size > 1.0) {
			this.draw = function(c) {
				c.strokeStyle = this.fs;
				c.beginPath();
				c.arc(this.getX(), this.getY(), this.size, 0, Math.PI*2, true);
				c.closePath();
				c.stroke();
			}
		} else {
			this.draw = function(c) {
				c.fillStyle = this.fs;
				var sx = this.getX() - 0.5;
				var sy = this.getY() - 0.5;
				c.beginPath();
				c.rect(sx, sy, 1, 1);
				for (var i=0; i<2; i++) {
					for (var j=0; j<2; j++) {
						c.rect(sx + (i * 2 - 1) * 2, sy + (j * 2 - 1) * 2, 1, 1);
						c.rect(sx + (i * 2 - 1), sy + (j * 2 - 1), 1, 1);
					}
				}
				c.closePath();
				c.fill();
				
			}
		}
	}
	
	/*** A player ship ***/
	function Ship(world) {
		this.type = t_ship;
		this.world = world;
        this.loc = new Point(gs.WIDTH / 2, gs.HEIGHT / 2);
		this.angle = 0;
		this.speed = 0;
		this.points = [new Point(0, -13), 
                       new Point(-7, 7), 
                       new Point(7, 7)];
		this.poly = [];
		this.lastsmoke = null;
		this.world.setPlayer(this);
		this.strokeStyle = 'rgba(255, 255, 255, 1.0)';
		this.fillStyle = 'rgba(115, 115, 115, 1.0)';
		
		this.keyHeld_A = this.keyDown_A = this.keyHeld_LeftArrow = this.keyDown_LeftArrow = function () {
			this.angle -= 0.1;
		}
		
		this.keyHeld_D = this.keyDown_D = this.keyHeld_RightArrow = this.keyDown_RightArrow = function () {
			this.angle += 0.1;
		}
		
		this.keyDown_W = this.keyDown_UpArrow = function () {
			this.speed = 1 * gs.METERS;
		}
		
		this.keyHeld_W = this.keyHeld_UpArrow = function () {
			if (this.speed < 3.0 * gs.METERS)
				this.speed += 0.3 * gs.METERS;
		}
		
		this.keyDown_Space = function () {
			// pass
		}
		
		this.keyDown = function (keyCode) {
			//console.log(keyCode);
		}
		
		this.collisionPoly = function() {
			return this.poly;
		}
		
		this.collided = function(other) {
			if (other.type == asteroid) {
				this.explode();
				other.explode();
				doReload(1);
			}
		}
		
		this.explode = function() {
			gs.delObject(this);
		}
		
		this.update = function() {
			if (this.speed > 0.1 * gs.METERS)
				this.speed -= 0.1 * gs.METERS;
			else
				this.speed = 0;
            this.loc = this.loc.translate(this.speed * Math.sin(this.angle),
                                          -this.speed * Math.cos(this.angle));
			for (n=0; n<this.points.length; n++) {
				this.poly[n] = this.points[n].rotate(this.angle);
                this.poly[n] = this.poly[n].translate(this.loc.x - this.world.cameraX(),
                                                      this.loc.y - this.world.cameraY());
            }
			if (this.speed && (!gs.knownObject(this.lastsmoke) || this.lastsmoke.loc.distance(this.loc) > 15)) {
                var smokeloc = this.loc.translate(-9 * Math.sin(this.angle),
                                                  9 * Math.cos(this.angle));
				this.lastsmoke = new Smoke(world, smokeloc);
				gs.addObject(this.lastsmoke);
			}
		}
		
		this.draw = function(c) {
			c.strokeStyle = this.strokeStyle;
			c.fillStyle = this.fillStyle;
            gs.drawPolygon(this.poly);
		}
	}
	
	var smokeStrength = [];
	for (var r=0; r<10; r++) {
		smokeStrength[r] = 'rgba(200, 200, 200, ' + (r/10) + ')';
	}
	/*** Smoke coming out of the ship ***/
	function Smoke(world, point) {
        this.loc = point;
		this.world = world;
		this.life = 1.0;
		var pi2 = Math.PI * 2;
		
		this.draw = function(c) {
			c.strokeStyle = smokeStrength[Math.floor(this.life * 10)];
			c.beginPath();
			c.arc(this.loc.x - this.world.cameraX(), 
                  this.loc.y - this.world.cameraY(), 
                  this.life * 2, 0, pi2, true);
			c.closePath();
			c.stroke();
		}
		
		this.update = function() {
			this.life -= 0.08;
			if (this.life < 0)
			{
				gs.delObject(this);
				this.life = 0.01;
			}
		}
	}
	
	/*** World ***/
	function World() {
		this.player = null;
        this.camera = new Point(0, 0);
		this.w = gs.WIDTH / 2;
		this.h = gs.HEIGHT / 2;
		this.quadrant = [0, 0];
		// seedable deterministic random number generator	
		var mt = new MersenneTwister();
		// our procedural map generator
		var map = new Map(mt);
		this.relx = 0;
		this.rely = 0;
		
		this.setPlayer = function(player) {
			this.player = player;
            this.camera = new Point(player.loc.x, player.loc.y);
			this.updateQuadrant();
		}
		
		this.updateQuadrant = function() {
//			this.quadrant = [Math.floor(this.player.loc.x / gs.WIDTH),
//  		Math.floor(this.player.loc.y / gs.HEIGHT)];
//			this.getQuadrant(this.quadrant);
		}
		
		this.cameraX = function() {
			return this.relx;
		}
		
		this.cameraY = function () {
			return this.rely;
		}

        this.keyDown_Z = function () {
            gs.setScale(gs.METERS + 1);
        }

        this.keyDown_X = function () {
            if(gs.METERS > 1)
                gs.setScale(gs.METERS - 1);
        }
		
		this.draw = function() {
			gs.clear();
			gs.setBackground('rgba(0, 0, 0, 1.0)');
            gs.ctx.fillStyle = 'rgba(255,255,255,1)';
            gs.ctx.fillText("Orion", 20, 20);
		}
		
		this.update = function() {
            this.camera = this.camera.translate((this.player.loc.x - this.camera.x) * 0.1,
                                                (this.player.loc.y - this.camera.y) * 0.1);
			this.relx = this.camera.x - this.w;
			this.rely = this.camera.y - this.h;
		}
		
		// cache of all asteroid objects by their ID
		var asteroidcache = {};
		var asteroidcachesize = 0;
		
		// let us get every asteroid around quadrant [x, y] using our map-generator object
		this.getQuadrant = function(quadrant) {
			var allasteroids = [];
			for (var i=-1; i<2; i++) {
				for (var j=-1; j<2; j++) {
					var pos = [quadrant[0] + i, quadrant[1] + j];
					var quadrantData = map.getQuadrantData(pos);
					var asteroids = quadrantData['asteroids'];
					allasteroids = allasteroids.concat(asteroids);
					for (var a=0; a<asteroids.length; a++) {
						if (!asteroidcache[asteroids[a]]) {
							asteroidcache[asteroids[a]] = new Asteroid(w, map.getAsteroidData(asteroids[a], quadrantData['asteroidSize']), quadrantData['asteroidSize'], pos);
							asteroidcachesize += 1;
							gs.addObject(asteroidcache[asteroids[a]]);
						}
					}
				}
			}
			// get rid of the asteroids in the cache which we no longer care about
			for (a in asteroidcache) {
				if (allasteroids.indexOf(asteroidcache[a].id) == -1) {
					gs.delObject(asteroidcache[a])
					delete asteroidcache[a];
					asteroidcachesize -= 1;
				}
			}
		}
	}
	
	w = new World();
	gs.addObject(w);
	for (n=0; n<10; n++) {
		gs.addObject(new Star(w));
	}
	gs.addObject(new Ship(w));
}
