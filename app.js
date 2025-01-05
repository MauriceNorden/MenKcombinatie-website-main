const express = require('express')
const app = express()
const path = require('path');
const fs = require('fs');
app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'))
const cors = require('cors');
app.use(cors());


//routes
app.get('/', (req, res) => {
    res.send(fs.readFileSync(__dirname + '/views/index.ejs', 'utf8'));
})

//Listen on port 3000
server = app.listen(3000)



//socket.io instantiation
const io = require("socket.io")(server)


//listen on every connection
io.on('connection', (socket) => {
	console.log('New user connected')

	//default username
	socket.username = "Anonymous"

    //listen on change_username
    socket.on('change_username', (data) => {
        socket.username = data.username
    })

    //listen on new_message
    socket.on('new_message', (data) => {
        //broadcast the new message
        io.sockets.emit('new_message', {message : data.message, username : socket.username});
    })

    //listen on typing
    socket.on('typing', (data) => {
    	socket.broadcast.emit('typing', {username : socket.username})
    })
})
