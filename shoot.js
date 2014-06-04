(function(){

	var canvas = document.getElementById("canvas"),
	ctx = canvas.getContext("2d");

	var player = {};
	var height = canvas.height;
	var widht  = canvas.width ;

	var assetsLoader = function(){

		this.imgs ={
			"shooter" : "./imgs/shooter.jpg",
			"bullet"  : "./imgs/bullet.png"
		};

		this.total = Object.keys(this.imgs).length;
		var loaded = 0;

		this.finished = function() {
			// body...
			console.log("All the images have been loaded");
		};

		this.load = function(dic,name) {
			// body...
			if(this[dic][name].status != "loading"){
				return ;
			}

			else{

				this[dic][name].status = "loaded";
				loaded += 1;
				if(loaded == this.total){
					finished.call();
				}
			}
		};

		this.downloadAll = function(){

			var src;
			var _this = this ;

			for(var img in this.imgs){
				if(this.imgs[img].hasOwnProperty){

					src = _this.imgs[img];
					(function(_this,img){

						_this.imgs[img] = new Image();
						_this.imgs[img].status = "loading";
						_this.imgs[img].name = img;
						_this.imgs[img].src =  src; 
						_this.imgs[img].onload = function(){ 
							load.call(_this,"imgs",img); 
						}	
					})(_this,img);
				}
			}

		}

		return{

			imgs : this.imgs,
			total : this.total,
			load  : this.load,
			downloadAll : this.downloadAll
		};

	}();

	KEY_STATUS = {};

	KEY_CODE = {
		37 : "left",
		38 : "up",
		39 : "right",
		32 : "space"
	};


	document.onkeyup = function(e){

		var keycode = e.keyCode;
		if(KEY_CODE[keycode].hasOwnProperty){ //whether the object has the required property
			KEY_STATUS[KEY_CODE[keycode]] = false;
		}
	}

	document.onkeydown = function(e){

		var keycode = e.keyCode;
		if(KEY_CODE[keycode].hasOwnProperty){
			KEY_STATUS[KEY_CODE[keycode]] = true ;
		}
	} 

	function Vector(x,y,dx,dy){

		this.x = x || 0;
		this.y = y || 0;
		
		this.dx = dx ;
		this.dy = dy ;
	}

	Vector.prototype.advance(){

		this.x += this.dx;
		this.y += this.dy;
	};

	var player = function(player){

		player.width = 50 ;
		player.height = 120 ;

		Vector.call(player,0,0,0,0);
		
		player.dx = 0;
		player.dy = 0;
		player.isJumping = false;

		player.spritesheet = new SpriteSheet();
		player.running = new Animation(player.spritesheet);
		player.


	}(Object.Vector.prototype);
	assetsLoader.downloadAll();

})()