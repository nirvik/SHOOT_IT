(function(){

	var canvas = document.getElementById("canvas"),
	ctx = canvas.getContext("2d");

	var player = {};
	var height = canvas.height;
	var widht  = canvas.width ;

	window.requestAnimFrame = function(){
	    return (
	        window.requestAnimationFrame       || 
	        window.webkitRequestAnimationFrame || 
	        window.mozRequestAnimationFrame    || 
	        window.oRequestAnimationFrame      || 
	        window.msRequestAnimationFrame     || 
	        function(/* function */ callback){
	            window.setTimeout(callback, 1000 / 60);
	        }
	    );
	}();

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
			startGame();
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
		if(KEY_CODE[keycode]){ //whether the object has the required property
			KEY_STATUS[KEY_CODE[keycode]] = false;
		}
	}

	document.onkeydown = function(e){

		var keycode = e.keyCode;
		if(KEY_CODE[keycode]){
			KEY_STATUS[KEY_CODE[keycode]] = true ;
		}
	} 

	function Vector(x,y,dx,dy){

		this.x = x || 0;
		this.y = y || 0;
		
		this.dx = dx ;
		this.dy = dy ;
	}

	Vector.prototype.advance = function(){

		this.x += this.dx;
		this.y += this.dy;
	};

	function SpriteSheet(path,framewidth,frameheight){

		this.image = new Image();
		this.image.src = path;

		this.frameheight = frameheight;
		this.framewidth = framewidth;

		var self = this;
		this.image.onload = function(){
			self.framesPerRow = Math.floor(self.image.width/self.framewidth);	
		}

	

	}

	function Animation(spritesheet,speed,startframe,endframe){

		var animationsequence = [];
		var counter = 0;
		var currentframe = 0;

		for(var i=startframe;i<=endframe;i++){
			animationsequence.push(i);
		}


		this.update = function(){

			if(counter == speed - 1){
				currentframe = (currentframe+1)%animationsequence.length;
			}
			counter = (counter+1)%speed;
		};

		this.draw = function(x,y){

			var row = Math.floor(animationsequence[currentframe]/spritesheet.framesPerRow);
			var col = Math.floor(animationsequence[currentframe] % spritesheet.framesPerRow);

			
			ctx.drawImage(
				spritesheet.image,
				col * spritesheet.framewidth,
				row * spritesheet.frameheight,
				spritesheet.framewidth,
				spritesheet.frameheight,
				x,y,
				spritesheet.framewidth,
				spritesheet.frameheight
			)
		};
	}

	var player = function(player){

		player.width = 110 ;
		player.height = 126 ;

		
		
		player.dx = 0;
		player.dy = 0;
		player.isJumping = false;
		player.gravity = 1;
		Vector.call(player,0,0,0,0);

		//If the player shoots release the bullet ; No need of particular animation
		player.isShooting = false;

		//Initializing players spritesheet 
		player.spritesheet = new SpriteSheet(
			assetsLoader.imgs["shooter"],
			player.width,
			player.height
		);
		
		//Players bullet 
		player.bullet = new Image();
		player.bullet.src = assetsLoader.imgs["bullet"];
		
		player.running = new Animation(player.spritesheet,4,0,31);
		player.jumping = new Animation(player.spritesheet,4,9,9);
		player.stop = new Animation(player.spritesheet,4,5,5);

		player.anim = player.stop;

		player.reset = function(){
			player.x = 60 ;
			player.y = 260; 
		};

		var jumpCounter = 0; //Continuously hold jump button 
		player.update = function(){


			if(KEY_STATUS.right){

				player.dx = 4;
			}

			else if (KEY_STATUS.left){
				player.dx = -4;
			}

			if(!KEY_STATUS.right && !KEY_STATUS.left){
				player.dx = 0;
			}

			if(KEY_STATUS.up && !player.isJumping){

				//console.log("Hey this should work");
				player.dy = -10;
				player.isJumping = true;
				jumpCounter = 20;
			}

			if(player.isJumping && jumpCounter){
				player.dy = -10;
				console.log(jumpCounter+","+player.isJumping)
			}

			jumpCounter = Math.max(jumpCounter-1,0);

			if(player.y > 260){
				player.dy = 0;
				player.y = 260;
				player.isJumping = false;
			}

			else{
				player.dy+=player.gravity;
			}

			this.advance();
			

			if(player.dy<0){
				//Jumping 
				player.anim = player.jumping;
			}

			else if(player.dx > 0 ){
				player.anim = player.running;
			}

			else if(player.dx < 0 ){
				player.anim = player.running;
			}
			else{ 
				//if(player.dx == 0)
				player.anim = player.stop;
				//console.log("STOPPED");
			}

			player.anim.update();


		};

		player.draw = function(){

			player.anim.draw(player.x,player.y);
		};

		return player;

	}(Object.create(Vector.prototype));

	function animate(){

		requestAnimFrame(animate);
		ctx.clearRect(0,0,canvas.width,canvas.height);
		player.update();
		player.draw();
	}

	function startGame(){

		player.reset();
		animate();

	}
	assetsLoader.downloadAll();

})()