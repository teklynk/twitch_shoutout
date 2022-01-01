$(document).ready(function () {

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        let results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    let channelName = getUrlParameter('channel').toLowerCase();
    let channelMessage = getUrlParameter('msg');

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

        getUserInfo(getChannel, function (info) {
            // Remove existing elements
            if (document.getElementById("userMsg") || document.getElementById("userImage") || document.getElementById("userName")) {
                document.getElementById("userMsg").remove();
                document.getElementById("userImage").remove();
                document.getElementById("userName").remove();
            }

            // TODO: check localStorage every second for clips overlay state
            // TODO: check if useClips is set

            let userImage = info.data[0]['profile_image_url'];
            let userDisplayName = info.data[0]['display_name'];
            let userMsg = decodeURI(channelMessage);

            $("<div id='userMsg' class='slide-left'><p>" + userMsg + "</p></div>").appendTo("#container");
            $("<div id='userImage'><img class='fade-in-image' src='" + userImage + "' alt=''/></div>").appendTo("#container");
            $("<div id='userName' class='slide-right'><p>" + userDisplayName + "</p></div>").appendTo("#container");
        });

    })
});