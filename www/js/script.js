var socket = io('http://localhost:4001');
var chatDialog = getE('#chat-dialog');
/* Create all important global variables*/
var messageHistory, world, movementInterval;
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
		getE('#message-body').focus();
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
	// points per second
	this.speed = 5;
	this.actions = new Actions(this, 'move');
	// movement = 1s/(speed * acceleration)
	this.acceleration = function() {

	};
	this.color = color;
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
        return vercor.x >= 0 && vector.width < this.x && vector.y >= 0 && vector.y < this.height;
    };
    this.get = function(vector) {
        return this.space[vector.x + (this.width * vector.y)];
    };
    this.set = function(vector, value) {
        this.space[vector.x + (this.width * vector.y)] = value;
    };
    this.reset = function(value, newVector){
    	this.set(value.position, null);
    	this.set(newVector, value);
    };
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
		rules.push('#'+this.tagId+'{width:'+(this.grid.width*scale)+'px;height:'+(this.grid.height*scale)+'px;}');
		rules.push('.player {width:'+(1*scale)+'px;height:'+(1*scale)+'px;}');
		rules.forEach(function(rule){
			document.styleSheets[1].insertRule(rule, 0);
		});
	};
	this.placePlayer = function(player, vector) {
		var styles = 'background-color:'+player.color+';';
		styles += 'left:'+(vector.x*this.scale)+'px;';
		styles += 'top:'+(vector.y*this.scale)+'px;';
		insertTag('SPAN', null, getE('#'+this.tagId), 'player '+player.id, styles);
	};
	this.movePlayer = function(player) {
		var playerTag = getE('.player '+player.id)[0];
		var style = playerTag.style;
		var pos = player.position;
		style.left = ((pos.x)*this.scale)+'px';
		style.top = ((pos.y)*this.scale)+'px';
	};
	this.removePlayer = function(player){
		getE('#'+this.tagId).removeChild(getE('.player '+player.id)[0]);
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
var World = function(grid, map, players) {
	this.grid = grid;
	this.map = map;
	this.players = players;
	this.setInMotion = function(player, direction){
		var position = player.position;
		var newVector = directions[direction];
		console.log(position.plus(newVector));
		player.position = position.plus(newVector);
		sendSocket('LOCATION',position.toString());
		this.grid.reset(player, newVector);
		this.map.movePlayer(player, newVector);
	};
	this.addPlayer = function(id, player, position){
		this.players[id] = player;
		if(position) {
			this.grid.set(position, player);
			this.map.placePlayer(player, player.position);
		}
	};
	this.removePlayer = function(player){
		this.map.removePlayer(player);
    	this.grid.set(player.position, null);
    	delete players[parts[0]];
	};
	this.setLocation = function(player, location){
		player.position = location;
		this.grid.set(location, player);
		this.map.placePlayer(player, player.position);
	};
};
var Actions = function(performer, move, pick, fight, reviev){
	this.performer = performer;
	if(move) {
		this.move = function(direction){
			if(!movementInterval){
				var performer = this.performer;
				var acceleration = performer.acceleration() || 1;
				movementInterval = setInterval(function(){	
					world.setInMotion(performer, direction);
				},1000 / (this.performer.speed*acceleration));
			}
		};
		this.stop = function() {
			clearInterval(movementInterval);
			movementInterval = null;
		};
	}
};
/* --- Connection actions --- */
socket.on('connect', function() {
	login('start');
	world = new World(null, null, {});
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
			break;
		case 'CONNECTED':
			var position = new Vector(getRandom(world.grid.width),getRandom(world.grid.height),0);
			var player = new Player(parts[1], getE('#log-in').value, position, 'blue');
			sendSocket('LOCATION',position.x+'|'+position.y+'|'+position.z);
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
				    	world.grid.reset(player, newPosition);
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
/* --- Setting all requires listeners --- */
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
	if(event.keyCode == 38) 
		world.players.me.actions.move('s');
	else if (event.keyCode == 40)
		world.players.me.actions.move('n');
	else if (event.keyCode == 37)
		world.players.me.actions.move('w');
	else if (event.keyCode == 39)
		world.players.me.actions.move('e');
});
getE('#controlls').addEventListener('keyup', function(){
	var key = event.keyCode;
	if(key == 37 || key == 38 || key == 39 || key == 40) 
		world.players.me.actions.stop();
});