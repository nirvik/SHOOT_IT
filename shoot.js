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

	function bullet(x,y){
		
		
		this.image = new Image();
		this.image.src = "./imgs/bullet.png";
		this.width = 16;
		this.height = 14;
		this.x = x;
		this.y = y;
		this.dx = 0;
		this.dy = 0 ;

		Vector.call(this,this.x,this.y,0,0);

		this.update = function(){
			this.dx = 15;
			this.advance();
		};

		this.draw = function(){
			ctx.drawImage(
				this.image,
				this.x,
				this.y,
				this.width,
				this.height
			)
		};

	}
	bullet.prototype = Object.create(Vector.prototype);

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
		player.bullet_collection = [];
		//Initializing players spritesheet 
		player.spritesheet = new SpriteSheet(
			assetsLoader.imgs["shooter"],
			player.width,
			player.height
		);
		
		
		player.running = new Animation(player.spritesheet,2,0,31);
		player.jumping = new Animation(player.spritesheet,4,9,9);
		player.stop = new Animation(player.spritesheet,4,5,5);

		player.anim = player.stop;

		player.reset = function(){
			player.x = 60 ;
			player.y = 260;
			//Players bullet 
			player.bullet_collection.push(new bullet(player.x,player.y+player.y/7)); 
			console.log(player.bullet);

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
			//	console.log(jumpCounter+","+player.isJumping)
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
			
			if(KEY_STATUS.space && !player.isShooting){
				//console.log("PELA");
				player.isShooting = true;
				player.bullet = new bullet(player.x,player.y+player.y/7);
				//player.bullet.collection.push(new bullet(player.x,player.y+player.y/7));
			}

			if(player.isShooting){
				player.bullet.update();
				player.bullet.draw();

				if(player.bullet.x > canvas.width){
					player.isShooting = false;
					console.log("player is not shooting anymore");

				}
			}
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

	function QuadTree(boundBox,lvl){

		var objects = [];
		this.bounds = boundBox || {

			x:0,
			y:0,
			width:0,
			height:0
		};

		this.nodes = [];
		var level = lvl || 0;
		var maxLevel = 4;
		var maxObjects = 5;

		this.clear = function(){

			for(var i = 0 ;i<this.nodes.length;i++){
				this.nodes[i].clear();
			}

			this.nodes = [];

		};

		this.getIndex = function(obj){

			var index = -1;
			var verticalMidPoint = this.bounds.height/2;
			var horizontalMidPoint = this.bounds.width/2;

			var left = (obj.x+this.bounds.width<verticalMidPoint && obj.x<verticalMidPoint);
			var right = (obj.x > verticalMidPoint);

			if(left){
				if(obj.y > horizontalMidPoint && obj.y + obj.height>horizontalMidPoint){
					index = 2;
				}

				if(obj.y < horizontalMidPoint){
					index = 1;
				}
			}

			if(right){
				if(obj.y > horizontalMidPoint && obj.y + obj.height>horizontalMidPoint){
					index = 3;
				}

				if(obj.y < horizontalMidPoint){
					index = 0;
				}
			}

			return index;

		};

		this.getAllObjects = function(returnedObject){

			for(var i = 0;i<this.nodes.length;i++){
				this.nodes[i].getAllObjects(returnedObject);
			}

			for(var i = 0;i<objects.length;i++){
				returnedObject.push(objects[i]);
			}
		};

		this.findObjects = function(returnedObject,obj){

			var index = this.getIndex(obj);

			if(index!=-1 && this.nodes.length){
				this.nodes[index].findObjects(returnedObject,obj);
			}

			for(var i=0;i<objects.length;i++){
				returnedObject.push(objects[i]);
			}

			return returnedObject;

		};

		this.split = function(){

			var subWidth = (this.bounds.width/2)|| 0;
			var subHeight = (this.bounds.height/2)|| 0;
			
			this.nodes[0] = new QuadTree({
				
				x: this.bounds.x+subWidth,
				y: this.bounds.y,
				width:subWidth,
				height:subHeight
			
			},level+1);

			this.nodes[1] = new QuadTree({
				
				x: this.bounds.x,
				y: this.bounds.y,
				width:subWidth,
				height:subHeight
			
			},level+1);

			this.nodes[2] = new QuadTree({
				
				x: this.bounds.x,
				y: this.bounds.y+subHeight,
				width:subWidth,
				height:subHeight
			
			},level+1);

			this.nodes[3] = new QuadTree({
				
				x: this.bounds.x+subWidth,
				y: this.bounds.y+subHeight,
				width:subWidth,
				height:subHeight
			
			},level+1);
		};

		this.insert = function(obj){

			if(typeof(obj) == "undefined")
				return;

			if(obj instanceof Array){
				
				for(var i=0;i<obj.length;i++){
					this.insert(obj[i]);
				}

			}

			if(this.nodes.length){
				
				var index = -1;
				index = this.getIndex(obj);

				if(index != -1){
					this.nodes[i].insert(obj);
				}
			}

			objects.push(obj);

			//To prevent Infinite splitting 

			if(level<maxLevel && objects.length >= maxObjects){

				if(this.nodes[0] == null ){
					this.split();
				}

				var i = 0;
				while(i<objects.length){

					var index = -1;
					index = this.getIndex(objects[i]); // find out which quad it belongs to
					if(index != -1){
						this.nodes[index].insert(objects[i]);
					}
					else{
						i+=1;
					}
				}

			}

		};

	}

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