var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');

app.set('trust proxy', 1);
app.use(session({ secret: 'kst', cookie: { maxAge: 60000 }, resave: true, saveUninitialized: true }));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('./public'));

var server = app.listen(process.env.PORT || 5000 ,function(){
	console.log("connected localhost:5000");
});

var io = require('socket.io').listen(server);

var people = {};  

app.get('/',function(req,res){
	req.session.authen =false;
});

io.on("connection",function(socket){
	socket.on("join",function(name){
		people[socket.id] = {"name" : name, "status" : null};
		socket.emit("update","You have connected to the server");
		io.sockets.emit("update",name+" has joined the server.");
		io.sockets.emit("update-people",people);
	});

	socket.on("send",function(msg){
		io.sockets.emit("chat",people[socket.id],msg);
	});

	socket.on("disconnect", function(){
        io.sockets.emit("update", people[socket.id] + " has left the server.");
        delete people[socket.id];
        io.sockets.emit("update-people", people);
    });

    socket.on("update-people",function(status){
    	people[socket.id] = {"name": people[socket.id].name, "status" : status};
    	io.sockets.emit("update-people",people);
    });

    socket.on("update-reset",function(){

    	for (var prop in people) {
    		people[prop].status = null;	
	    }
	    console.log(people);
	    io.sockets.emit("update-people",people);

    });

     socket.on('chat message', function(msg){
	    io.emit('chat message', msg);
	  });

});

app.get('/admin', function(req, res){

	req.session.authen = true;
	res.redirect('room.html');
 	
});

app.get('/authen', function(req, res){

	if(req.session.authen)
	{	
		res.send("1");
	} 	
	else
	{
		res.send("2");
	}
 	
});

app.get('/logout', function(req, res){

	req.session.destroy();
	res.redirect('./');
		
});
