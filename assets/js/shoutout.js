$(document).ready(function () {

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        let results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    let client = '';

    let channelName = getUrlParameter('channel').toLowerCase();

    let showClip = getUrlParameter('showClip');

    let showRecentClip = getUrlParameter('showRecentClip');

    let showMsg = getUrlParameter('showMsg');

    let showText = getUrlParameter('showText');

    let ref = getUrlParameter('ref');

    let modsOnly = getUrlParameter('modsOnly');

    let timeOut = getUrlParameter('timeOut');

    if (!timeOut) {
        timeOut = 10;
    }

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

    function sortByProperty(property) {
        return function (a, b) {
            if (a[property] < b[property])
                return 1;
            else if (a[property] > b[property])
                return -1;
            return 0;
        }
    }

    if (ref) {
        client = new tmi.Client({
            options: {debug: true},
            connection: {reconnect: true},
            identity: {
                username: channelName,
                password: 'oauth:' + atob(ref)
            },
            channels: [channelName]
        });
    } else {
        client = new tmi.Client({
            options: {debug: true},
            connection: {reconnect: true},
            channels: [channelName]
        });
    }

    client.connect().catch(console.error);

    // triggers on message
    client.on('chat', (channel, user, message, self) => {
        // shout-out message
        if (user['message-type'] === 'chat' && message.startsWith('!')) {
            let getChannel;
            let titleText;

            if (message.startsWith('!so')) {
                getChannel = message.substr(4);
                getChannel = getChannel.replace('@', '');
            } else {
                return false; // Exit, do nothing else
            }

            if (modsOnly === 'true' && (user.mod || user.username === channelName)) {
                doShoutOut(); // mods only
            } else if (modsOnly === 'false' || user.username === channelName) {
                doShoutOut(); // everyone
            }

            function doShoutOut() {

                getDetails(getChannel, function (info) {

                    if (showMsg === 'true') {
                        // Say message in chat
                        client.say(channelName.toLowerCase(), "Go check out " + info.data[0]['broadcaster_name'] + "! They were playing: " + info.data[0]['game_name'] + " - " + info.data[0]['title'] + " - https://twitch.tv/" + info.data[0]['broadcaster_login']);
                    }

                    // Show Clip
                    if (showClip === 'true' || showRecentClip === 'true') {

                        // Ignore if video clip is playing
                        if (document.getElementById("clip")) {
                            return false; //do nothing
                        }

                        getClips(getChannel, '20', function (info) {

                            // Sort array by created_at
                            info.data.sort(sortByProperty('created_at'));

                            // If clips exist
                            if (info.data[0]['created_at']) {
                                // Remove existing video element
                                if (document.getElementById("clip")) {
                                    document.getElementById("clip").remove();
                                    document.getElementById("text-container").remove();
                                }

                                // Default value = most recent index after sorted
                                let indexClip = 0;

                                // Random clip logic
                                if (showClip === 'true') {
                                    let numOfClips = info.data.length;
                                    indexClip = Math.floor(Math.random() * numOfClips);
                                }

                                // Parse thumbnail image to build the clip url
                                let thumbPart = info.data[indexClip]['thumbnail_url'].split("-preview-");
                                thumbPart = thumbPart[0] + ".mp4";

                                // Text on top of clip
                                if (showText === 'true') {
                                    titleText = "<div id='text-container'><span class='title-text'>Go check out " + info.data[0]['broadcaster_name'] + "</span></div>"
                                } else {
                                    titleText = '';
                                }

                                // Video Clip
                                $(titleText + "<video id='clip' class='video' width='100%' height='100%' autoplay src='" + thumbPart + "'><source src='" + thumbPart + "' type='video/mp4'></video>").appendTo("#container");

                                // Timeout start
                                let timer = 0;

                                // Remove video after timeout has been reached
                                let startTimer = setInterval(function () {
                                    timer++; // increment timer

                                    if (timer === parseInt(timeOut)) {
                                        document.getElementById("clip").remove();
                                        document.getElementById("text-container").remove();
                                        timer = 0; // reset timer to zero
                                        clearInterval(startTimer);
                                    }

                                    console.log(timer);

                                }, 1000);

                                // Remove video element after it has finished playing
                                document.getElementById("clip").onended = function (e) {
                                    document.getElementById("clip").remove();
                                    document.getElementById("text-container").remove();
                                    timer = 0; // reset timer to zero
                                    clearInterval(startTimer);
                                };

                            }
                        });
                    }

                });
            }

        }
    });

});