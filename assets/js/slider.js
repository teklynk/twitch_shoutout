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
    let useClips = getUrlParameter('useClips');
    let command = getUrlParameter('command');

    if (!command) {
        command = 'so'; // default
    }

    if (!timeOut) {
        timeOut = 10; // default
    }

    if (!useClips) {
        useClips = 'false'; // default
    }

    if (!modsOnly) {
        modsOnly = 'true'; // default
    }

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

        if (message.startsWith('!' + command)) {
            getChannel = message.substr(command.length + 1);
            getChannel = getChannel.replace('@', '');
        } else {
            return false; // Exit and Do nothing else
        }

        // Ignore if already displaying a shoutout
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

                    // TODO: Refactor this logic. A lot of duplicated code here.

                    // Remove slider elements after timeout has been reached
                    let startTimer = setInterval(function () {
                        timer++; // Increment timer

                        // If using CLIPS duration settings
                        if (timer > 5 && useClips === 'true' && localStorage.getItem('TwitchSOVideoState') !== 'active') {
                            // Slide in animation
                            document.getElementById("userMsg").classList.remove("slide-left-in");
                            document.getElementById("userImage").getElementsByClassName("image")[0].classList.remove("fade-in-image");
                            document.getElementById("userName").classList.remove("slide-right-in");

                            // Slide out animation
                            document.getElementById("userMsg").classList.add("slide-right-out");
                            document.getElementById("userImage").getElementsByClassName("image")[0].classList.add("fade-out-image");
                            document.getElementById("userName").classList.add("slide-left-out");

                            // Completely remove elements after 1 seconds and animation has completed
                            setTimeout(function () {
                                if (document.getElementById("userMsg") || document.getElementById("userImage") || document.getElementById("userName")) {
                                    document.getElementById("userMsg").remove();
                                    document.getElementById("userImage").remove();
                                    document.getElementById("userName").remove();
                                }
                                timer = 0; // Reset timer to zero
                                clearInterval(startTimer);
                            }, 1000);
                        }

                        // If using duration settings
                        if (useClips === 'false' && timer === parseInt(timeOut)) {
                            // Slide in animation
                            document.getElementById("userMsg").classList.remove("slide-left-in");
                            document.getElementById("userImage").getElementsByClassName("image")[0].classList.remove("fade-in-image");
                            document.getElementById("userName").classList.remove("slide-right-in");

                            // Slide out animation
                            document.getElementById("userMsg").classList.add("slide-right-out");
                            document.getElementById("userImage").getElementsByClassName("image")[0].classList.add("fade-out-image");
                            document.getElementById("userName").classList.add("slide-left-out");

                            // Completely remove elements after 1 seconds and animation has completed
                            setTimeout(function () {
                                if (document.getElementById("userMsg") || document.getElementById("userImage") || document.getElementById("userName")) {
                                    document.getElementById("userMsg").remove();
                                    document.getElementById("userImage").remove();
                                    document.getElementById("userName").remove();
                                }
                                timer = 0; // Reset timer to zero
                                clearInterval(startTimer);
                            }, 1000);
                        }

                    }, 1000);

                    let userImage = info.data[0]['profile_image_url'];
                    let userDisplayName = info.data[0]['display_name'];
                    let userMsg = decodeURI(channelMessage);

                    $("<div id='userMsg' class='slide-left-in'><p>" + userMsg + "</p></div>").appendTo("#container");
                    $("<div id='userImage'><img class='image fade-in-image' src='" + userImage + "' alt=''/></div>").appendTo("#container");
                    $("<div id='userName' class='slide-right-in'><p>" + userDisplayName + "</p></div>").appendTo("#container");

                } else {

                    return false;

                }
            });
        }

    })
});