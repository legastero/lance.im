/** 
 *  Orion: An XMPP-based multiplayer space game.
 *  Copyright (C) 2010 Lance Stout
 *  This file is part of Orion.
 *
 *  See the file LICENSE for copying permissions.
 */


function startOrion(game) {

    this.Overview = function () {
        this.menuWidth = 30;
        this.borderPadding = 15;
        this.infoPadding = 20;
        this.lineHeight = 10;
        this.border = [];
        this.systemName = "Orion";
                           
        this.update = function () {
            var mw = this.menuWidth,
                bp = this.borderPadding,
                gh = game.HEIGHT,
                gw = game.WIDTH;
            this.border = [new Point(mw + bp, gh - bp),
                           new Point(mw + bp, bp),
                           new Point(gw - bp, bp),
                           new Point(gw - bp, gh - bp)];
        }

        this.draw = function (ctx) {
            var mw = this.menuWidth,
                bp = this.borderPadding,
                ip = this.infoPadding,
                lh = this.lineHeight;

            game.ctx.fillStyle = "rgba(0,0,0,0)";
            game.ctx.strokeStyle = "rgba(255,255,255,.6)";
            game.drawPolygon(this.border);

            game.ctx.font = "14px Arial";
            game.ctx.fillStyle = "#FFF";
            game.ctx.strokeStyle = "#FFF";
            game.ctx.fillText("Current Location:", mw+bp+ip, bp+ip);
            game.drawPolygon([
                new Point(mw + bp + 1.2*ip, bp + ip + .8*lh),
                new Point(mw + bp + 1.2*ip, bp + ip + 1.2*lh),
                new Point(mw + bp + ip + .75*lh, bp + ip + lh)]);
            game.ctx.fillText(this.systemName, mw + bp + ip + 1.5*lh, bp + ip + 1.3*lh);
        }
    }

    this.World = function () {
        this.camera = new Point(0, 0);
        this.center = new Point(game.WIDTH / 2,
                                game.HEIGHT / 2);
        this.delta = new Point(0, 0);
        this.ship = null;

        this.cameraX = function() {
            return this.delta.x;
        }

        this.cameraY = function() {
            return this.delta.y;
        }

        this.update = function () {
            this.camera = this.camera.translate((this.ship.loc.x - this.camera.x) * 0.1,
                                                (this.ship.loc.y - this.camera.y) * 0.1);
			this.delta.x = this.camera.x - this.center.x;
			this.delta.y = this.camera.y - this.center.y;
        }

        this.draw = function (ctx) {
            game.clear();
            game.setBackground("rgba(0,0,0,.7)");
            game.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
            game.ctx.fillStyle = "rgba(255, 255, 255, 1)";
        }
    }

    this.Player = function () {
        this.name = "Legastero";
    }

	this.Ship = function (world) {
		this.world = world;
        this.world.ship = this;
        this.loc = new Point(game.WIDTH / 2, game.HEIGHT / 2);
		this.angle = 0;
		this.speed = 0;
		this.points = [new Point(0, -13), 
                       new Point(-7, 7), 
                       new Point(-10, 13),
                       new Point(-7, 13),
                       new Point(-7, 16),
                       new Point(7, 16),
                       new Point(7, 13),
                       new Point(10, 13),
                       new Point(7, 7)];
		this.poly = [];
		this.strokeStyle = 'rgba(255, 255, 255, 1.0)';
		this.fillStyle = 'rgba(115, 115, 115, 1.0)';
		
		this.keyHeld_A = this.keyDown_A = this.keyHeld_LeftArrow = this.keyDown_LeftArrow = function () {
			this.angle -= 0.1;
		}
		
		this.keyHeld_D = this.keyDown_D = this.keyHeld_RightArrow = this.keyDown_RightArrow = function () {
			this.angle += 0.1;
		}
		
		this.keyDown_W = this.keyDown_UpArrow = function () {
			this.speed = 1 * game.METERS;
		}
		
		this.keyHeld_W = this.keyHeld_UpArrow = function () {
			if (this.speed < 3.0 * game.METERS)
				this.speed += 0.3 * game.METERS;
		}
		
		this.update = function() {
			if (this.speed > 0.1 * game.METERS)
				this.speed -= 0.1 * game.METERS;
			else
				this.speed = 0;
            this.loc = this.loc.translate(this.speed * Math.sin(this.angle),
                                          -this.speed * Math.cos(this.angle));
			for (n=0; n < this.points.length; n++) {
				this.poly[n] = this.points[n].rotate(this.angle);
                this.poly[n] = this.poly[n].translate(this.loc.x - this.world.cameraX(),
                                                      this.loc.y - this.world.cameraY());
            }

            if (this.speed && (!game.knownObject(this.lastExhaust) || this.lastExhaust.loc.distance(this.loc) > 10)) {
                var exhaustLoc1 = this.loc.translate(-15 * Math.sin(this.angle) - 3 * Math.cos(this.angle),
                                                      15 * Math.cos(this.angle) - 3 * Math.sin(this.angle));
                var exhaustLoc2 = this.loc.translate(-15 * Math.sin(this.angle) + 3 * Math.cos(this.angle),
                                                      15 * Math.cos(this.angle) + 3 * Math.sin(this.angle));
				this.lastExhaust1 = new Exhaust(world, exhaustLoc1);
				this.lastExhaust2 = new Exhaust(world, exhaustLoc2);
				game.addObject(this.lastExhaust1);
				game.addObject(this.lastExhaust2);
            }
		}
		
		this.draw = function(ctx) {
			ctx.strokeStyle = this.strokeStyle;
			ctx.fillStyle = this.fillStyle;
            game.drawPolygon(this.poly);
		}
    }

    this.Exhaust = function (world, point) {
       this.world = world;
       this.loc = point;
       this.life = 1.0;

       this.draw = function (ctx) {
           var strength = 'rgba(200, 200, 200, ' + (Math.floor(this.life * 10) * game.random(0, 1)) + ')';
           ctx.strokeStyle = strength;
           ctx.beginPath();
           ctx.arc(this.loc.x - this.world.cameraX(),
                   this.loc.y - this.world.cameraY(),
                   this.life * 2, 0, Math.PI * 2, true);
           ctx.closePath();
           ctx.stroke();
       }

       this.update = function () {
           this.life -= 0.1;
           if (this.life < 0) {
               game.delObject(this);
               this.life = 0.0;
           }
       }
    }

    // ================================================================
    // Setup
    // ================================================================

    this.world = new World();
    this.player = new Player();
    this.ship = new Ship(this.world);
    this.overview = new Overview();

    game.addObject(this.world);
    game.addObject(this.player);
    game.addObject(this.overview);
    game.addObject(this.ship);
};
