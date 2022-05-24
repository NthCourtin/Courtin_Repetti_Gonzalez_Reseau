$(document).ready(function(){
    let socket = io();

    socket.on("connect", function (){
        socket.emit("enter_room","chan1");
    });

    //event au clique
    $('#submit').on('click', function(e){
        e.preventDefault();
        let data = {
            name: $('#username').val(),
            message : $('#message').val(),
            room: document.querySelector("#channel li.active").dataset.room
        };
        socket.emit('new_message', data);
        $('#message').val("");
    });

    socket.on('error_message', function(phrase){
        $('#response').html(phrase);
    });

    socket.on('reception_message', function(data){
        publiMessage(data);
    });

    document.querySelectorAll("#channel li").forEach(function(tab) {
        tab.addEventListener("click", function (){
            if (!this.classList.contains("active")){
                const actif = document.querySelector("#channel li.active");
                actif.classList.remove("active");
                this.classList.add("active");
                document.querySelector("#messages").innerHTML="";
                socket.emit("sortie_room", actif.dataset.room);
                socket.emit("enter_room", this.dataset.room);
            }
        })
    });

    socket.on("init_message",msg =>{
        console.log("INIT MESSAGE")
        let data = JSON.parse((msg.messages));
        if (data !== []){
            data.forEach(donnees =>{
                publiMessage(donnees);
            });
        }
    });

    socket.on("not_sub", id =>{
        console.log("pas sub client");
        document.querySelector("#messages").innerHTML ="";
        const node = document.createElement("h1");
        const nodeH1 = document.createTextNode("Vous n'etes pas sub a ce channel");
        node.appendChild(nodeH1);
        const node2 = document.createElement("p");
        const nodeP = document.createTextNode("Taper SUBSCRIBE pour vous inscrire");
        node2.appendChild(nodeP);
        node.style.margin="0px";
        document.querySelector("#messages").appendChild(node);
        document.querySelector("#messages").appendChild(node2);
    });

    socket.on("sub", room =>{
        console.log("sub");
        document.querySelector("#messages").innerHTML="";
        socket.emit("sortie_room", room);
        socket.emit("enter_room", room);
    })
});

function publiMessage(data){
    $('#messages').append('<li>' + data.name+ ' : ' + data.message+ '</li>');
}
