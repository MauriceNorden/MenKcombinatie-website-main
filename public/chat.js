
$(function(){
   	//make connection
	var socket = io.connect('https://mkcombinatie.nl')

	//buttons and inputs
	var message = $("#message")
	var username = $("#username")
	var send_message = $("#send_message")
	var send_username = $("#send_username")
	var chatroom = $("#chatroom")
	var feedback = $("#feedback")
	//verzoekjes
	var muziekrequest = $("#verzoekje-form")
	var naamrequest = $("#naam-request")
	var nummerrequest = $("#nummer-request")
	var messagerequest = $("#berichtje-input")

	message.hide();
	chatroom.hide();
	send_message.hide();
	feedback.hide();
	//Emit message
	send_message.submit(function(event){
		event.preventDefault();
		socket.emit('change_username', {username : sessionStorage.getItem("username")})
		console.log(sessionStorage.getItem("username"))
		socket.emit('new_message', {message : message.val()})
		chatroom.scrollTop(function() { return this.scrollHeight; });
		message.val('');
	})

	//Listen on new_message
	socket.on("new_message", (data) => {
		feedback.hide();
		chatroom.append("<p class='message'>" + data.username + ": " + data.message + "</p>")
		chatroom.scrollTop(function() { return this.scrollHeight; });
	})

	//Emit a username
	send_username.submit(function(event){
		event.preventDefault();
		sessionStorage.setItem("username", username.val());
		socket.emit('change_username', {username : username.val()})
		errorHandeling(`Welkom ${username.val()}`, "green", "false");
		send_username.hide();
		message.show();
		chatroom.show();
		send_message.show();

	})
	muziekrequest.submit(function(event){

		event.preventDefault();
		socket.emit('change_username', {username : `<b>VERZOEKJE`})
		socket.emit('new_message', {message : `Van: ${naamrequest.val()} Nummer: ${nummerrequest.val()} Bericht: ${messagerequest.val()}</b>`})

		errorHandeling(`Bedankt voor je verzoekje ${naamrequest.val()}`, "green", "false");
		naamrequest.val('');
		nummerrequest.val('');
		messagerequest.val('');
	})
	//Emit typing
	message.bind("keypress", () => {
		socket.emit('change_username', {username : sessionStorage.getItem("username")})
		socket.emit('typing')
	})

	//Listen on typing
	socket.on('typing', (data) => {
		feedback.show();
		chatroom.scrollTop(function() { return this.scrollHeight; });
		feedback.html("<p><i>" + data.username + " Is een bericht aan het typen........" + "</i></p>")
//		feedback.hide();

		  
	})
});


