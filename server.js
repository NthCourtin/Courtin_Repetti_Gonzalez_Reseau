// instanciation de express
let express = require('express');
let app = express();

//on creer le serveur http
let server = require('http').createServer(app);

//on instancie socket.io
let io = require('socket.io')(server);

// Demande au serveur de repondre sur le port 8080
let port = process.env.PORT || 8080;
server.listen(port);

app.use(express.static(__dirname + '/public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
const path = require("path");
const dbPath = path.resolve(__dirname,'chat.sqlite');

const Sequelize = require("sequelize");
const {BOOLEAN} = require("sequelize");

const sequelize = new Sequelize("database","unsername","password",{
    host : "localhost",
    dialect:"sqlite",
    logging : false,
    storage: dbPath
});

const Chat = require("./Modele/Chat")(sequelize,Sequelize.DataTypes);
Chat.sync();

let subChan1 = new Array();
let subChan2 = new Array();
let subChan3 = new Array();

let sub = BOOLEAN;

io.on('connection', function(client){
    console.log("Connecté");


    client.on('new_message', function(data){
        // Vérification du pseudonyme
        if(!data.name || typeof data.name === undefined || data.name.length > 25){
            client.emit('error_message', "Le pseudonyme rentré n'est pas valide !");
            return;
        }

        // Vérification du message
        if(!data.message || typeof data.message === undefined || data.message.length > 255){
            client.emit('error_message', "Le message rentré n'est pas valide !");
            return;
        }

        //Sub a un channel
        if (!sub && data.message === "SUBSCRIBE"){
            client.emit("sub", data.room);
            if (data.room=== "chan1"){
                subChan1.push(client.id);
            }
            if (data.room=== "chan2"){
                subChan2.push(client.id);
            }
            if (data.room=== "chan3"){
                subChan3.push(client.id);
            }
            return;
        }

        if (!sub){
            return;
        }

        //Unsub a un channel
        if (sub && data.message === "UNSUBSCRIBE"){
            client.emit("not_sub", data.room);
            if (data.room=== "chan1"){
                const myIndex = subChan1.indexOf(client.id);
                if (myIndex !== -1) {
                    subChan1.splice(myIndex, 1);
                }
            }
            if (data.room=== "chan2"){
                const myIndex = subChan2.indexOf(client.id);
                if (myIndex !== -1) {
                    subChan2.splice(myIndex, 1);
                }
            }
            if (data.room=== "chan3"){
                const myIndex = subChan3.indexOf(client.id);
                if (myIndex !== -1) {
                    subChan3.splice(myIndex, 1);
                }
            }
            return;
        }

        //relaie du message
        const message = Chat.create({
            name: data.username,
            message: data.message,
            room: data.room
        }).then(()=>{
            console.log(data.room);
            io.in(data.room).emit("reception_message",data);
        }).catch(e =>{
            console.log(e);
        });
    });

    client.on('disconnect', function(){
        delete client;
    });

    client.on("enter_room", function (room){
        client.join(room);
        console.log(client.rooms)

        if ((subChan1.includes(client.id) && room === "chan1") || (subChan2.includes(client.id) && room === "chan2") ||
            (subChan3.includes(client.id) && room === "chan3")){
            sub = true;
            client.emit("error_message","Taper UNSUBSCRIBE pour vous desabonner")
        }else {
            client.emit("not_sub", client.id);
            sub = false;
            console.log("Pas sub");
            client.emit("error_message","")
            return;
        }
        Chat.findAll({
            attributes:["id","name","message","room"],
            where:{
                room:room
            }
        }).then(list=>{
            client.emit("init_message", {
                messages : JSON.stringify(list)
            })
        });
    });

    client.on("sortie_room", function (room){
        client.leave(room);
        sub = false;
        console.log(client.rooms);
    });
});