(function(){

	var canvas = document.getElementById("canvas"),
	ctx = canvas.getContext("2d");

	var player = {};
	var enemy = {};
	var height = canvas.height;
	var widht  = canvas.width ;

	var quadTree;

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
			"bullet"  : "./imgs/bullet.png",
			"zombie"  : "./imgs/skeleton.png"
		};

		total = Object.keys(this.imgs).length;
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

	function Bullet(x,y){
		
		this.type = "bullet"
		this.collidableWith = "zombie";
		this.isColliding = false;

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

			ctx.clearRect(this.x-1,this.y-1,this.width+2,this.height+2);

			if(this.isColliding){
				return true;
			}

			else if(this.x > canvas.width){
				return true;
			}

			else{
				
				ctx.drawImage(
					this.image,
					this.x,
					this.y,
					this.width,
					this.height
				)

				return false;
			}
		};

	}
	Bullet.prototype = Object.create(Vector.prototype);

	var player = function(player){

		player.width = 110 ;
		player.height = 126 ;
		
		player.isColliding = false;
		player.collidableWith = "zombie";
		player.type = "shooter";
		
		player.dx = 0;
		player.dy = 0;
		player.isJumping = false;
		player.gravity = 1;
		Vector.call(player,0,0,0,0);

		//If the player shoots release the bullet ; No need of particular animation
		player.isShooting = false;
		//player.bullet_collection = [];
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

			if(player.isColliding){
				player.isColliding = false;
				player.dx = -2;
			}

			this.advance();
			
			if(KEY_STATUS.space && !player.isShooting){
				//console.log("PELA");
				player.isShooting = true;
				player.bullet = new Bullet(player.x,player.y+player.y/7);
				
			}

			if(player.isShooting){
				player.bullet.update();

				if(player.bullet.draw()){
					player.isShooting = false;
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

	var enemy = function(enemy){

		enemy.type = "zombie";
		enemy.isColliding = false;
		enemy.collidableWith = "bullet"
		
		enemy.width = 35.5;
		enemy.height = 72;

		enemy.spritesheet = new SpriteSheet(assetsLoader.imgs["zombie"],
			enemy.width,
			enemy.height
		);
		enemy.walk = new Animation(enemy.spritesheet,5,1,3);//10,1,8);
		enemy.shot = new Animation(enemy.spritesheet,10,6,8);
		enemy.anim = enemy.walk;

		enemy.dx = 0;
		enemy.dy = 0;

		Vector.call(enemy,0,0,0,0);

		enemy.reset = function(){
			
			enemy.x = 800 - 100;
			enemy.y = 260;
			enemy.dx = -0.7;
			enemy.isColliding = false;
		};

		enemy.update = function(){
			
			if(enemy.isColliding){
				enemy.anim = enemy.shot;
				enemy.dx = 0;

			}

			else{
				enemy.anim = enemy.walk;
				if(enemy.dx != -0.7){
					enemy.dx = -0.7;
				}
			}

			this.advance();
			enemy.anim.update();
		};

		enemy.draw = function(){
			enemy.anim.draw(enemy.x,enemy.y);
		};
		return enemy;
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

			objects = [];
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

			return returnedObject;
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
					this.nodes[index].insert(obj);
				}
			}

			objects.push(obj);

			//To prevent Infinite splitting 

			if(level<maxLevel && objects.length > maxObjects){

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

	function detectCollision(){
		
		var objects = [];
		quadTree.getAllObjects(objects);
		
		for(var x = 0;x<objects.length;x++){
			quadTree.findObjects(obj=[],objects[x]);
			for(var y = 0;y<obj.length;y++){		
				//console.log(objects[x].collidableWith+"<->"+obj[y].type)
				
				if(objects[x].collidableWith == obj[y].type 
					&& objects[x].x<obj[y].x+obj[y].width 
					&& objects[x].x+objects[x].width > obj[y].x
					 && objects[x].y+objects[x].height>obj[y].y
					 && objects[x].y < obj[y].y+obj[y].height){

					console.log("it fucking collided");
					objects[x].isColliding = true;
					obj[y].isColliding = true;
				}
					

			}
		}
	}

	function animate(){

		requestAnimFrame(animate);
		ctx.clearRect(0,0,canvas.width,canvas.height);
		quadTree.clear();
		quadTree.insert(player);
		quadTree.insert(player.bullet);
		quadTree.insert(enemy);

	//	console.log(quadTree);
		player.update();
		player.draw();
		enemy.update();
		enemy.draw();
		detectCollision();
	}

	function startGame(){

		quadTree = new QuadTree({x:0,y:0,width:800,height:800});
		enemy.reset();
		player.reset();

		console.log(enemy);
		animate();

	}
	assetsLoader.downloadAll();

})()