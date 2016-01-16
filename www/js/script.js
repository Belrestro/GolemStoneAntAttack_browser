var socket = io('http://localhost:4001');
var chatDialog = getE('#chat-dialog');
/* Create all important global variables*/
var messageHistory, world, movementInterval = {};
/* Simpify DOM*/
function getE(element) {
	var selector = element.charAt(0);
	var query = element.slice(1);
	if(selector=="#") {
		return document.getElementById(query);
	} else if(selector==".") {
		return document.getElementsByClassName(query);
	} else {
		return document.getElementsByTagName(element);
	}
}
/* After player sends message sends to the last message he sended. && Under construction*/
function scrollDialog(direction) {
	if (direction == 'bottom') {
		var chatDialog = getE('#chat-dialog');
		clearTimeout(x);
		var x = setTimeout(function() {chatDialog.scrollTop = chatDialog.scrollHeight}, 100);
	}
}
/* Makes sure that player would have a nickname, and perform prepearing actions && Under construction*/
function login(arg) {
	if(arg!= "start"){
		//Prevents user from creating multiple connections(weak)
		getE('#login-button').style.pointerEvents = 'none';
		//Sends correct connect socket
		socket.send('CONNECT|'+getE('#log-in').value+'~');
		//Visualize 
		getE("#login").style.opacity = 0;
		var x = setTimeout(function(){getE("#login").style.display = 'none';getE('#chat-inputs').style.opacity=1;},1100);
		//Set user for chat
		insertTag('P','Hi '+getE('#log-in').value+'!', chatDialog, "message");
		getE('#controlls').focus();
	} else {
		//Visualize 
		getE("#login").style.opacity = 1;
		getE("#login-window").style.animation = 'slideTop 1s';
		//Set user to login
		getE('#log-in').focus();
	}
}
function getRandom(max){
	return Math.floor(Math.random()*max);
}
/* Proper insertion to DOM*/
function insertTag(tag, value, parent, className, styles) {
	var child = document.createElement(tag);
	if(className)
		child.className = className;
	if(value)
		child.appendChild(document.createTextNode(value));
	if(styles) {
		var styleRules = styles.split(';');
		styleRules.forEach(function(rule){
			if(!rule)
				return;
			var styleRule = rule.split(':');
			styleRule.map(function(part){
				return part.trim();
			});
			child.style[styleRule[0]] = styleRule[1];
		});
	}
	parent.appendChild(child);
}
/* Wraps message to socket format*/
function sendSocket(type, message){
	var delimeter = '~';
	socket.send(type+"|"+message+delimeter);
}
function sendChatMessage(input) {
	if(!input.value) return;
	sendSocket('CHAT',input.value);
	//adding message history items
	if(!messageHistory) messageHistory = new MessageHistory();
	messageHistory.add(input);
	messageHistory.pos = -1;
	input.value = "";
	scrollDialog('bottom');
}
/* --- Createing constructors --- */
/* For now color argument represents identification of current player or affiliation to team, team object will be created later*/
var Player = function(id, nickname, position, color) {
	this.id = id;
	this.nickname = nickname;
	this.position = position;
	this.rotationDirection = 's';
	// points per second
	this.speed = 6;
	this.actions = new Actions(this, ['MOVE','PICK']);
	// movement = 1s/(speed * acceleration)
	this.acceleration = {
		start:1,max:2,step:0.5
	};
	this.color = color;
};
var isPlayer = function(something){
	return something instanceof Player;
};
var Item = function(){
};
var Rock = function(id, position, mass){
	this.type = "rock";
	this.id = id;
	this.mass = mass;
	this.position = position;
	this.speed = 5;
	this.acceleration = {
		start:40,max:0,step:-4
	};
	this.actions = new Actions(this, ['MOVE']);
	this.effects = {demage:5};
};
var Vector = function(x,y,z) {
	this.x = Number(x);
	this.y = Number(y);
	this.z = Number(z);
	this.plus = function(vector) {
		return new Vector(this.x + vector.x, this.y + vector.y, this.z + vector.z);
	};
	this.minus = function(vector) {
		return new Vector(this.x - vector.x, this.y - vector.y, this.z - vector.z );
	};
	this.toString = function() {
		return this.x+"|"+this.y+"|"+this.z;
	};
	this.sameAs = function(vector){
		return this.x == vector.x && this.y == vector.y && this.z == vector.z;
	}
};
var directions = {
	"n": new Vector(0,1,0),
	"e": new Vector(1,0,0),
	"s": new Vector(0,-1,0),
	"w": new Vector(-1,0,0),
	"u": new Vector(0,0,1),
	"d": new Vector(0,0,-1)
};
var Grid = function(width,height) {
    this.space = new Array(width * height);
    this.width = Number(width);
    this.height = Number(height);
    this.isInside = function(vector) {
        return vector.x >= 0 && vector.x < this.width && vector.y >= 0 && vector.y < this.height;
    };
    this.isInRange = function(condition, coordinates, range){
    	var x = coordinates.x + -(range);
    	var y = coordinates.y + -(range);
    	var self = coordinates.x+coordinates.y;
		for(;x<(coordinates.x+range+1);x++)
			for(var ordinate = y;ordinate<(coordinates.y+range+1);ordinate++) {
				if(condition(this.space[x+(this.width*ordinate)]) && x+ordinate != self)
					return true;
			}
		return false;
    };
    this.isInDirection = function() {

    };
    this.get = function(vector) {
        return this.space[vector.x + (this.width * vector.y)];
    };
    this.set = function(vector, value) {
        this.space[vector.x + (this.width * vector.y)] = value;
    };
    this.reset = function(vector, player){
    	var position = player.position;
    	delete this.space[position.x + (this.width * position.y)];
    	this.set(vector, player);
    };
    this.getRandomLocation = function(range){
			var location = new Vector(getRandom(this.width),getRandom(this.height),0);
			function isNothing(something){
				return something == null;
			}
			while(!(this.get(location)==null) && !(this.isInRange(isNothing,location,range)))
				location = new Vector(getRandom(this.width),getRandom(this.height),0);
			return location;
	};
};
/* Landscape & Legend are on development*/
var Map = function(grid, players, tagId, scale, landscape, legend) {
	this.grid = grid;
	this.players = players;
	this.tagId = tagId;
	// scale is shuld be : "this/original" "2/1"
	this.scale = scale;
	this.isInMap = function(object){
		return getE('#'+this.tagId).indexOf(object)> -1;
	};
	this.adjustScale = function(){
		var scale = this.scale;
		if(!getE('style')[1])
			insertTag('STYLE',null,getE('head')[0]);
		var rules = [];
		// map size
		rules.push('#'+this.tagId+'{width:'+(this.grid.width*scale)+'px;height:'+(this.grid.height*scale)+'px;}');
		// players fize
		rules.push('.player {width:'+(1*scale)+'px;height:'+(1*scale)+'px;}');
		rules.forEach(function(rule){
			document.styleSheets[1].insertRule(rule, 0);
		});
	};
	this.placePlayer = function(player, vector) {
		var styles = 'background-color:'+player.color+';';
		styles += 'left:'+(vector.x*this.scale)+'px;';
		styles += 'top:'+(vector.y*this.scale)+'px;';
		insertTag('SPAN', null, getE('#'+this.tagId), 'player p'+player.id, styles);
		// add diretion arrow
		insertTag('SPAN','^',getE('.player p'+player.id)[0], 'rotation-arrow js-ra-'+player.id);
		//add player name, looks ugly now...
		insertTag('SPAN',player.nickname,getE('.player p'+player.id)[0], 'player-nickname js-n-n'+player.id);
		var nickname = getE('.js-n-n'+player.id)[0];
		var playerTag = getE('.player p'+player.id)[0];
		nickname.style.left = -((nickname.offsetWidth/2)-(playerTag.offsetWidth/2))+'px';
	};
	this.movePlayer = function(player) {
		var playerTag = getE('.player p'+player.id)[0];
		var style = playerTag.style;
		var pos = player.position;
		style.left = ((pos.x)*this.scale)+'px';
		style.top = ((pos.y)*this.scale)+'px';
		var directionArrow = {'s':{top:-150,left:0,rotate:0}, 'e':{top:-60,left:102,rotate:90},'n':{top:50,left:0,rotate:180},'w':{top:-60,left:-102,rotate:270}};
		var arrow = getE('.js-ra-'+player.id)[0];
		style = arrow.style;
		var rotationDirection = directionArrow[player.rotationDirection];
		style.top = rotationDirection.top+'%';
		style.left = rotationDirection.left+'%';
		if(!Boolean(style.opacity))
			style.opacity = 1;
		style.transform = 'rotate('+rotationDirection.rotate+'deg)';
	};
	this.removePlayer = function(player){
		getE('#'+this.tagId).removeChild(getE('.player p'+player.id)[0]);
	};
	this.placeItem = function(item, vector){
		var tag = getE('#'+this.tagId);
		var styles = "";
		styles += 'left:'+(vector.x*this.scale)+'px;';
		styles += 'top:'+(vector.y*this.scale)+'px;';
		styles += 'background-color:grey;';
		insertTag('SPAN', null, tag, 'item '+item.type+' i-'+item.id, styles);
	};
	this.moveItem = function(item) {
		var itemTag = getE('.i-'+item.id)[0];
		var style = itemTag.style;
		var pos = item.position;
		style.left = ((pos.x)*this.scale)+'px';
		style.top = ((pos.y)*this.scale)+'px';
	};
};
/* Created to handle comlicated tasks*/
var World = function(grid, map, players, items) {
	this.grid = grid;
	this.map = map;
	this.players = players;
	this.items = items;
	this.addPlayer = function(id, player, position){
		this.players[id] = player;
		if(position) {
			this.grid.set(position, player);
			this.map.placePlayer(player, player.position);
		}
	};
	this.removePlayer = function(player){
		this.map.removePlayer(player);
    	delete this.grid.space[player.position.x+(this.grid.width*player.position.y)];
    	delete players[player.id];
	};
	this.setLocation = function(player, location){
		player.position = location;
		this.grid.set(location, player);
		this.map.placePlayer(player, player.position);
	};
	this.resetLocation = function(player, location){
		this.grid.reset(location, player);
		player.position = location;
		if(isPlayer(player))
			this.map.movePlayer(player);
		else
			this.map.moveItem(player);
	};
	this.setInMotion = function(player, direction){
		var grid = this.grid;
		function playerInTheWay(object){
			var vector = directions[player.rotationDirection];
			var possiblePlayer = player.position.plus(vector);
			return isPlayer(object) &&  isPlayer(grid.get(possiblePlayer));
		}
		if(isPlayer(player)){
			if(grid.isInside(player.position.plus(direction)) && !grid.isInRange(playerInTheWay,player.position,1))
				this.resetLocation(player, player.position.plus(direction));
			else
				player.actions.stop(player.position);
		} else {
			if(grid.isInside(player.position.plus(direction)))
				this.resetLocation(player, player.position.plus(direction));
			else
				player.actions.stop(player.position);
		}
	};
	this.addItem = function(item, position) {
		var location = position || this.grid.getRandomLocation(2);
		item.position = location;
		this.items[item.id] = item;
		this.grid.set(location, item);
		console.log(item);
		console.log(location);
		this.map.placeItem(item, location);
	};
};
var Actions = function(performer, options){
	this.performer = performer;
	var isInOptions = function(argument){
		return options.some(function(option){
			return option == argument;
		});
	};
	if(isInOptions('MOVE')) {
		this.move = function(direction, sSpeed, sAcceleration){
			if(!movementInterval[this.performer.id]){
				var player = this.performer;
				var speed = sSpeed || player.speed;
				var acceleration = sAcceleration || player.acceleration.start || 1;
				for(var dir in directions)
					if(directions.hasOwnProperty(dir))
						if(directions[dir].sameAs(direction))
							player.rotationDirection = dir;
				if(player == world.players.me)
					sendSocket('MOVE',direction.toString()+'|'+speed+'|'+acceleration);
				function setDynamicSpeed(boost){
					// to stop if there is no speed
					if(boost <= 0 || speed <= 0) {
						player.actions.stop(player.position);
						// player button event prevention
						if(!(player instanceof Rock))
							movementInterval[player.id] = true;
						return;
					}
					var max = player.acceleration.max;
					var step = player.acceleration.step;
					var newBoost =boost+step;
					if(max > 0 ? boost > max : boost < max) 
						boost = max;
					world.setInMotion(player, direction);
					movementInterval[performer.id] = setTimeout(function(){
						setDynamicSpeed(Number(newBoost.toFixed(4)));
					},1000 / (speed*boost));
				}
				setDynamicSpeed(acceleration);
			}
		};
		this.stop = function(location) {
			var player = this.performer;
			clearTimeout(movementInterval[player.id]);
			movementInterval[player.id] = null;
			world.resetLocation(player, location);
			if(player == world.players.me)
				sendSocket('STOP', player.position.toString());
		}
	} if(isInOptions('PICK')) {
		this.pick = function(object){

		};
	}
};
var MessageHistory = function() {
	this.pos = -1;
	this.array = [];
	this.limit = 10;
	this.previous = function(input) {
		if(this.pos < this.array.length-1)
			this.pos++;
		input.value = this.array[this.pos];
	};
	this.next = function(input) {
		if(this.pos >-1)
			this.pos--;
		if(this.pos != -1)
			input.value = this.array[this.pos];
		else 
			input.value = '';
	};
	this.add = function(input) {
		this.array.unshift(input.value);
		this.pos = -1;
		//only last 10 counts
		if (this.array.length > this.limit) this.array.pop();
	};
};
/* To safe some features and be more Player frendly*/
// --> Cookies work quite slow... 
// --> takes 20-60 ms to done all transitions
// --> be awere if it
var Cookies = function() {
	this.content = document.cookie;
	this.read = function(){
		var rawCookies = this.content.split(',');
		var freshCookies = {};
		rawCookies.map(function(cookie){
			var data = cookie.split(':');
			if(data[0] && data[0]!='_')
				freshCookies[data[0]] = data[1];
		});
		return freshCookies;
	};
	this.write = function(cookies, renewAll){
		var keys = Object.keys(cookies);
		// to save all existing(or rewrite old) features, and add all new
		var newCookies = renewAll ? {} : this.read();
		keys.forEach(function(newCookie){
			newCookies[newCookie] = cookies[newCookie];
		});
		var cookie = "";
		var keys = Object.keys(newCookies);
		keys.forEach(function(key, index){
			cookie += key+':'+newCookies[key];
			if(index<keys.length-1)
				cookie += ",";
		});
		document.cookie = cookie;
	};
	this.remove = function(cookieKey){
		var oldCookies = this.read();
		if(Object.keys(oldCookies).length == 1) {
			this.clearAll();
			return;
		}
		delete oldCookies[cookieKey];
		this.write(oldCookies, true);
	};
	this.clearAll = function(){
		document.cookie = '_';
	};
};
/* --- Connection actions --- */
socket.on('connect', function() {
	login('start');
	world = new World(null, null, {}, {});
	sendSocket('GRID');
});
/* Sort incoming messages*/
socket.on('message', function(msg){
	var parts = msg.split('~');
	parts = parts[0].split('|');
	switch(parts[0]){
		case 'GRID':
			world.grid = new Grid(Number(parts[1]),Number(parts[2]));
			world.map = new Map(world.grid, world.players,'map__sandbox',6/1);
			world.map.adjustScale();
			// simply add an item 
			world.addItem(new Rock(0));
			break;
		case 'CONNECTED':
			var position = world.grid.getRandomLocation(2);
			var player = new Player(parts[1], getE('#log-in').value, position, 'blue');
			sendSocket('LOCATION',position.toString());
			world.addPlayer('me', player, position);
			sendSocket('PLAYERSINFO');
			break;
		default:
			// Everething that goes on with players
			if(!isNaN(parts[0])){
				switch(parts[1]) {
					case 'CONNECTED':
						// this is called spectator
						world.players[parts[0]] = new Player(parts[0],parts[2],null,'red');
						insertTag('P', parts[2]+' joined;', chatDialog, 'message');
						break;
					case 'PLAYERSINFO':
						if(!world.players[parts[0]]) {
							var player = new Player(parts[0],parts[2],new Vector(parts[3],parts[4],parts[5]),'red');
				    		world.addPlayer(player.id, player, player.position);
				    	}
						break;
				    case 'LOCATION':
				    	var player = world.players[parts[0]];
				    	var position = player.position;
				    	var newPosition = new Vector(parts[2],parts[3],parts[4]);
				    		world.setLocation(player, newPosition);
				    	break;
				    case 'MOVE':
				    	var player = world.players[parts[0]];
				    	var direction = new Vector(parts[2],parts[3],parts[4]);
				    	var speed = parts[5];
				    	var acceleration = parts[6];
				    	player.actions.move(direction, speed, acceleration)
				    	break;
				    case 'STOP':
				    	var player = world.players[parts[0]];
				    	var location = new Vector(parts[2],parts[3],parts[4]);
				    	player.actions.stop(location);
				    	break;
				    case 'DISCONNECT':
				    	var player = world.players[parts[0]];
				    	world.removePlayer(player);
				    	break;
					default:
						console.log(parts);
					    break;
				}
				break;
			}
			var messages = msg.split('~');
			insertTag('P', messages[0], chatDialog ,'message');
			break;
	}
});
/* --- Setting all required listeners --- */
getE('#send-message').addEventListener('click',function(){ 
	sendChatMessage(getE('#message-body'));
});
//siply adding an option to login with 'ENTER'
getE('#log-in').addEventListener('keypress', function(){
	if(event.keyCode == 13) login()
});
// --> left : 37, up : 38, right : 39, down : 40;
//reading the history, and adding option to send message on key 'ENTER'
getE('#message-body').addEventListener('keydown', function() {
	if(event.keyCode == 38){
		if(messageHistory)
			messageHistory.previous(getE('#message-body'));
	}
	else if (event.keyCode == 40){
		if(messageHistory)
			messageHistory.next(getE('#message-body'));
	}
	else if (event.keyCode == 13) {
		sendChatMessage(getE('#message-body'));;
	}
});
getE('#map').addEventListener('click', function(){
	getE('#controlls').focus();
});
getE('#controlls').addEventListener('keydown', function(){
	var matches = {38:'s', 40:'n',37:'w',39:'e'};
	var button = event.keyCode;
	if(button in matches)
		world.players.me.actions.move(directions[matches[button]]);
});
getE('#controlls').addEventListener('keyup', function(){
	var key = event.keyCode;
	if(key == 37 || key == 38 || key == 39 || key == 40){
		var me = world.players.me;
		me.actions.stop(me.position);
	}
});