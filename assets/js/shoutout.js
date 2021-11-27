$(document).ready(function () {

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        let results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    let channelName = getUrlParameter('channel');

    let playClip = getUrlParameter('showClip');

    if (channelName === '') {
        alert('channel is not set in the URL');
    }

    let authtoken = localStorage.getItem('TwitchSOAuthToken');
    let clientId = localStorage.getItem('TwitchSOClientId');

    if (authtoken === '') {
        alert('Auth Token not set');
    }

    if (clientId === '') {
        alert('Client Id not set');
    }

    // Twitch API: user info: user_id
    function getInfo(channelName, callback) {
        let urlI = "https://api.twitch.tv/helix/users?login=" + channelName + "";
        let xhrI = new XMLHttpRequest();
        xhrI.open("GET", urlI);
        xhrI.setRequestHeader("Authorization", "Bearer " + authtoken + "");
        xhrI.setRequestHeader("Client-Id", clientId);
        xhrI.onreadystatechange = function () {
            if (xhrI.readyState === 4 && xhrI.status === 200) {
                callback(JSON.parse(xhrI.responseText));
                return true;
            } else {
                return false;
            }
        };

        xhrI.send();
    }

    // Twitch API get last game played from a user
    let getDetails = function (channelID, callback) {
        let urlG = "https://api.twitch.tv/kraken/channels/" + channelID + "";
        let xhrG = new XMLHttpRequest();
        xhrG.open("GET", urlG);
        xhrG.setRequestHeader("Accept", "application/vnd.twitchtv.v5+json");
        xhrG.setRequestHeader("Client-Id", clientId);
        xhrG.onreadystatechange = function () {
            if (xhrG.readyState === 4) {
                callback(JSON.parse(xhrG.responseText));
                return true;
            } else {
                return false;
            }
        };
        xhrG.send();
    };

    // Twitch API get clips for !so command
    let getClips = function (refUserID, callback) {
        let urlC = "https://api.twitch.tv/helix/clips?broadcaster_id=" + refUserID + "&first=20";
        let xhrC = new XMLHttpRequest();
        xhrC.open("GET", urlC);
        xhrC.setRequestHeader("Authorization", "Bearer " + authtoken + "");
        xhrC.setRequestHeader("Client-Id", clientId);
        xhrC.onreadystatechange = function () {
            if (xhrC.readyState === 4) {
                callback(JSON.parse(xhrC.responseText));
                return true;
            } else {
                return false;
            }
        };
        xhrC.send();
    };

    const client = new tmi.Client({
        options: {debug: true},
        connection: {reconnect: true},
        identity: {
            username: channelName,
            password: 'oauth:' + authtoken
        },
        channels: [channelName]
    });

    client.connect().catch(console.error);

    // triggers on message
    client.on('chat', (channel, user, message, self) => {
        // shout-out message
        if (user['message-type'] === 'chat' && message.startsWith('!')) {
            let getChannel;

            if (message.startsWith('!so')) {
                getChannel = message.substr(4);
            } else {
                return false;
            }

            getInfo(getChannel, function (data) {
                getDetails(data.data[0]['id'], function (info) {
                    // Say message in chat
                    client.say(channelName, getChannel + " was last playing: " + info['game'] + " - " + info['status'] + " - " + info['url']);

                    // Show Clip
                    if (playClip === 'true') {
                        getClips(data.data[0]['id'], function (info) {
                            // if clips exist
                            if (info.data[0]['id']) {
                                if (document.getElementById("clip")) {
                                    document.getElementById("clip").remove();
                                }
                                let numOfClips = info.data.length;
                                let randClip = Math.floor(Math.random() * numOfClips);
                                let thumbPart = info.data[randClip]['thumbnail_url'].split("-preview-");
                                thumbPart = thumbPart[0] + ".mp4";
                                $("<video id='clip' class='video' autoplay><source src='" + thumbPart + "' type='video/mp4'></video>").appendTo("#container");

                                document.getElementById("clip").onended = function(e) {
                                    document.getElementById("clip").remove();
                                };
                            }
                        });

                    }

                });
            });
        }
    });

});