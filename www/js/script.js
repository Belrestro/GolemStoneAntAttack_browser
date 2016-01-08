var socket = io('http://localhost:4001');
var chatDialog = getE('#chat-dialog');
var grid, messageHistory, player;
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
/* After player sends message sends to the last message he sended. ||| Extending*/
function scrollDialog(direction) {
	if (direction == 'bottom') {
		var chatDialog = getE('#chat-dialog');
		clearTimeout(x);
		var x = setTimeout(function() {chatDialog.scrollTop =chatDialog.scrollHeight}, 100);
	}
}
/* The correct way of displayin any kind of messges ||| may be applied to other sourses*/
function displayMessage(message, parent) {
	var msg = document.createElement('P');
	msg.className = 'message';
	var content = document.createTextNode(message);
	msg.appendChild(content);
	parent.appendChild(msg);
}
/* Makes sure that player would have a nickname, and perform prepearing actions*/
function login(arg) {
	if(arg!= "start"){
		//Prevents user from creating multiple connections(weak)
		getE('#login-button').style.pointerEvents = 'none';
		//Sends correct connect socket
		socket.send('CONNECT|'+getE('#log-in').value+'~');
		//Visualize 
		getE("#login").style.opacity = 0;
		var x = setTimeout(function(){getE("#login").style.display = 'none';getE('#chat').style.opacity=1;},1100);
		//Set user for chat
		displayMessage('Hi '+getE('#log-in').value+'!', chatDialog);
		getE('#message-body').focus();
	} else {
		//Visualize 
		getE("#login").style.opacity = 1;
		getE("#login-window").style.animation = 'slideTop 1s';
		//Set user to login
		getE('#log-in').focus();
	}
}
/* Wraps message to socket format*/
function sendSocket(type, message){
	var delimeter = '~';
	socket.send(type+"|"+message+delimeter);
}
function sendChatMessage(input) {
	sendSocket('CHAT',input.value);
	//adding message history items
	if(!messageHistory) messageHistory = new MessageHistory();
	messageHistory.add(input);
	messageHistory.pos = -1;
	input.value = "";
	scrollDialog('bottom');
}
/* --- Createing constructors --- */
var Player = function(id, nickname) {
	this.id = id;
	this.nickname = nickname;
}
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
}
var Grid = function(width,height) {
    this.space = new Array(width * height);
    this.width = width;
    this.height = height;
    this.isInside = function(vector) {
        return vercor.x >= 0 && vector.width < this.x && vector.y >= 0 && vector.y < this.height;
    };
    this.get = function(vector) {
        return this.space[vector.x + this.width * vector.y];
    };
    this.set = function(vector, value) {
        this.space[vector.x + this.width * vector.y] = value;
    };
}
var Vector = function(x,y) {
	this.x = x;
	this.y = y;
	this.plus = function(vector) {
		return new Vector(this.x + vector.x, this.y + vector.y);
	};
	this.minus = function(vecotr) {
		return new Vector(this.x - vector.x, this.y - vector.y);
	};
}
/* --- Connection actions --- */
socket.on('connect', function() {
	login('start');
	socket.send('GRID~');
});
/* Sort incoming messages*/
socket.on('message', function(msg){
	var parts = msg.split('~');
	parts = parts[0].split('|');
	switch(parts[0]){
		case 'GRID':
			grid = new Grid(Number(parts[1]),Number(parts[2]));
			console.log(grid);
			break;
		case 'CONNECTED':
			player = new Player(parts[1], getE('#log-in').value);
			console.log(player);
			break;
		default:
			if(!isNaN(parts[0])){
				displayMessage(parts[2]+' joined;',chatDialog);
				break;
			}
			var messages = msg.split('~');
			displayMessage(messages[0],chatDialog);
			break;
	}
});
/* --- Setting all requires listeners --- */
getE('button')[0].addEventListener('click',function(){ 
	sendChatMessage(getE('#message-body'));
});
//siply adding an option to login with 'ENTER'
getE('#log-in').addEventListener('keypress', function(){
	if(event.keyCode == 13) login()
});
//reading the history, and adding option to send message on key 'ENTER'
getE('#message-body').addEventListener('keydown', function() {
	if(event.keyCode == 38) {
		messageHistory.previous(getE('#message-body'));
	} else if (event.keyCode == 40) {
		messageHistory.next(getE('#message-body'));
	} else if (event.keyCode == 13) 
		sendChatMessage(getE('#message-body'));;
});