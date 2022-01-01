$(document).ready(function () {

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        let results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    let channelName = getUrlParameter('channel').toLowerCase();
    let channelMessage = getUrlParameter('msg');
    let timeOut = getUrlParameter('timeOut');
    let modsOnly = getUrlParameter('modsOnly');

    // Twitch API get user info for !so command
    let getUserInfo = function (SOChannel, callback) {
        let urlU = "https://twitchapi.teklynk.com/getuserinfo.php?channel=" + SOChannel;
        let xhrU = new XMLHttpRequest();
        xhrU.open("GET", urlU);
        xhrU.onreadystatechange = function () {
            if (xhrU.readyState === 4) {
                callback(JSON.parse(xhrU.responseText));
                return true;
            } else {
                return false;
            }
        };
        xhrU.send();
    };

    let client = new tmi.Client({
        options: {debug: true},
        connection: {reconnect: true},
        channels: [channelName]
    });

    client.connect().catch(console.error);

    // Triggers on message
    client.on('chat', (channel, user, message, self) => {

        let getChannel;

        if (message.startsWith('!so')) {
            getChannel = message.substr(4);
            getChannel = getChannel.replace('@', '');
        } else {
            return false; // Exit and Do nothing else
        }

        // Ignore if video clip is playing
        if (document.getElementById("userMsg")) {
            return false; // Exit and Do nothing
        }

        if (modsOnly === 'true' && (user.mod || user.username === channelName)) {
            doShoutOutSlider(); // Mods only
        } else if (modsOnly === 'false' || user.username === channelName) {
            doShoutOutSlider(); // Everyone
        }

        function doShoutOutSlider() {

            getUserInfo(getChannel, function (info) {
                // If user exists
                if (info.data.length > 0) {

                    // Remove existing elements on load
                    if (document.getElementById("userMsg") || document.getElementById("userImage") || document.getElementById("userName")) {
                        document.getElementById("userMsg").remove();
                        document.getElementById("userImage").remove();
                        document.getElementById("userName").remove();
                    }

                    // Timeout start
                    let timer = 0;

                    // Remove video after timeout has been reached
                    let startTimer = setInterval(function () {
                        timer++; // Increment timer

                        console.log(timer);

                        if (timer === parseInt(timeOut)) {
                            document.getElementById("userMsg").classList.remove("slide-left-in");
                            document.getElementById("userImage").getElementsByClassName("image")[0].classList.remove("fade-in-image");
                            document.getElementById("userName").classList.remove("slide-right-in");

                            document.getElementById("userMsg").classList.add("slide-right-out");
                            document.getElementById("userImage").getElementsByClassName("image")[0].classList.add("fade-out-image");
                            document.getElementById("userName").classList.add("slide-left-out");
                            timer = 0; // reset timer to zero
                            clearInterval(startTimer);

                            // Completely remove elements after 3 seconds
                            setTimeout(function () {
                                document.getElementById("userMsg").remove();
                                document.getElementById("userImage").remove();
                                document.getElementById("userName").remove();
                            }, 1000);
                        }

                    }, 1000);

                    let userImage = info.data[0]['profile_image_url'];
                    let userDisplayName = info.data[0]['display_name'];
                    let userMsg = decodeURI(channelMessage);

                    $("<div id='userMsg' class='slide-left-in'><p>" + userMsg + "</p></div>").appendTo("#container");
                    $("<div id='userImage'><img class='image fade-in-image' src='" + userImage + "' alt=''/></div>").appendTo("#container");
                    $("<div id='userName' class='slide-right-in'><p>" + userDisplayName + "</p></div>").appendTo("#container");
                }
            });
        }

    })
});