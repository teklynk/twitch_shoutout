$(document).ready(function () {

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        let results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    let channelName = getUrlParameter('channel').toLowerCase();

    let showClip = getUrlParameter('showClip');

    let showRecentClip = getUrlParameter('showRecentClip');

    let showMsg = getUrlParameter('showMsg');

    let showText = getUrlParameter('showText');

    let ref = getUrlParameter('ref');

    let modsOnly = getUrlParameter('modsOnly');

    if (channelName === '') {
        alert('channel is not set in the URL');
    }

    // Twitch API get last game played from a user
    let getDetails = function (SOChannel, callback) {
        let urlG = "https://twitchapi.teklynk.com/getuserstatus.php?channel=" + SOChannel + "";
        let xhrG = new XMLHttpRequest();
        xhrG.open("GET", urlG);
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
    let getClips = function (SOChannel, limit, callback) {
        let urlC = "https://twitchapi.teklynk.com/getuserclips.php?channel=" + SOChannel + "&limit=" + limit;
        let xhrC = new XMLHttpRequest();
        xhrC.open("GET", urlC);
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
            password: 'oauth:' + atob(ref)
        },
        channels: [channelName]
    });

    client.connect().catch(console.error);

    // triggers on message
    client.on('chat', (channel, user, message, self) => {
        // shout-out message
        if (user['message-type'] === 'chat' && message.startsWith('!')) {
            let getChannel;
            let titleText;

            if (message.startsWith('!so')) {
                getChannel = message.substr(4);
            } else {
                return false;
            }

            if (modsOnly === 'true' && (user.mod || user.username === channelName)) {
                doShoutOut(); //mods only
            } else if (modsOnly === 'false' || user.username === channelName) {
                doShoutOut(); //everyone
            }

            function doShoutOut() {
                //getInfo(getChannel, function (data) {
                getDetails(getChannel, function (info) {

                    if (showMsg === 'true') {
                        // Say message in chat
                        client.say(channelName.toLowerCase(), "Go check out " + info.data[0]['broadcaster_name'] + "! They were playing: " + info.data[0]['game_name'] + " - " + info.data[0]['title'] + " - https://twitch.tv/" + info.data[0]['broadcaster_login']);
                    }

                    // Show Clip
                    if (showClip === 'true' || showRecentClip === 'true') {

                        // Default set to Random clip
                        let clipLimit = '20';
                        // Recent clip
                        if (showRecentClip === 'true') {
                            clipLimit = '1';
                        }

                        getClips(getChannel, clipLimit, function (info) {
                            // If clips exist
                            if (info.data[0]['id']) {
                                // Remove existing video element
                                if (document.getElementById("clip")) {
                                    document.getElementById("clip").remove();
                                    document.getElementById("text-container").remove();
                                }

                                // Random clip logic
                                let numOfClips = info.data.length;
                                let randClip = Math.floor(Math.random() * numOfClips);

                                // Parse thumbnail image to build the clip url
                                let thumbPart = info.data[randClip]['thumbnail_url'].split("-preview-");
                                thumbPart = thumbPart[0] + ".mp4";

                                // Text on top of clip
                                if (showText === 'true') {
                                    titleText = "<div id='text-container'><span class='title-text'>Go check out " + info.data[0]['broadcaster_name'] + "</span></div>"
                                } else {
                                    titleText = '';
                                }

                                // Video Clip
                                $(titleText + "<video id='clip' class='video' width='100%' height='100%' autoplay src='" + thumbPart + "'><source src='" + thumbPart + "' type='video/mp4'></video>").appendTo("#container");

                                // Remove video element after it has finished playing
                                document.getElementById("clip").onended = function (e) {
                                    document.getElementById("clip").remove();
                                    document.getElementById("text-container").remove();
                                };
                            }
                        });
                    }

                });
            }

        }
    });

});