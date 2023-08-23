

var socket = io();
var usernameInput = document.getElementById('username');
var messageInput = document.getElementById('message');
var sendButton = document.getElementById('send');
var messagesDiv = document.getElementById('messages');

enviarmsjs =function() {
    var text = messageInput.value;
    var username = usernameInput.value;
    socket.emit('message', { username: username, text: text });
    messageInput.value = '';
};

sendButton.onclick(enviarmsjs)

socket.on('Mensajes', function(messages) {
    messagesDiv.innerHTML = '';
    for (var message of messages) {
        var messageElement = document.createElement('p');
        messageElement.innerHTML = '<strong>' + message.username + ': </strong>' + message.text;
        messagesDiv.appendChild(messageElement);
    }
});
