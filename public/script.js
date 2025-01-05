const errorHandeling = async (message, color, refresh) => {
    var currentColor = ""
    const errorDiv = document.getElementById("error-div");
    const errorMessage = document.getElementById("error-message");
    if(color == "green"){
        currentColor = "var(--green)";
    }if(color === "red"){
        currentColor = "var(--red)";
    }
    errorMessage.innerHTML = message;
    errorDiv.style.background = currentColor;
    errorDiv.style.display = "block";

    if (refresh === "true") {
    await setTimeout(function () {
        location.reload();
    }, 2000);}else{
       await setTimeout(function () {
            errorDiv.style.display = "none";
        }, 3000);
    }
}

function SetVolume(val) {
    var player = document.getElementById("player");
    player.volume = val / 100;
    }

    var player = document.getElementById("player");
    var pause = document.getElementById("pause-ico");
    var play = document.getElementById("play-ico");
    var isPlaying = false;
    
    function togglePlay() {
    
    isPlaying ? player.pause() : player.play();
    }
    
    player.onplaying = function () {
    isPlaying = true;
    play.style.display = "none";
    pause.style.display = "block";
    };
    player.onpause = function () {
    isPlaying = false;
    play.style.display = "block";
    pause.style.display = "none";
    };

    function toggelChat() {
    var chat = document.getElementById("chat");


    
    if (chat.style.display === "block") {
        chat.style.display = "none";
        document.body.style.overflow = "auto";

        
    }else{
        chat.style.display = "block";
        document.body.style.overflow = "hidden";
    }
}


function hideChat() {
    var chat = document.getElementById("chat");


    
    if (chat.style.display === "block") {
        chat.style.display = "none";
        document.body.style.overflow = "auto";


        
    }
}




var thumbnails1 = document.getElementById("thumbnails-1")
var imgs1 = thumbnails1.getElementsByTagName("img")
var main1 = document.getElementById("main-1")
var counter1 = 0;

for (let i = 0; i < imgs1.length; i++) {
    let img1 = imgs1[i]
    img1.addEventListener("click", function () {
        main1.src = this.src
    })

}