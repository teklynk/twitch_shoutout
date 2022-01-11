$(document).ready(function () {

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        let results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    function arrayPlusDelay(array, delegate, delay) {
        // initialize all calls right away
        array.forEach(function (el, i) {
            setTimeout(function () {
                // each loop, call passed in function
                delegate(array[i]);

                // stagger the timeout for each loop by the index
            }, i * delay);
        })
    }

    // Sort function
    function sortByProperty(property) {
        return function (a, b) {
            if (a[property] < b[property])
                return 1;
            else if (a[property] > b[property])
                return -1;
            return 0;
        }
    }

    let cmdArray = [];

    let client = '';

    let channelName = getUrlParameter('channel').toLowerCase();

    let showClip = getUrlParameter('showClip');

    let showRecentClip = getUrlParameter('showRecentClip');

    let showMsg = getUrlParameter('showMsg');

    let showText = getUrlParameter('showText');

    let showImage = getUrlParameter('showImage');

    let ref = getUrlParameter('ref');

    let modsOnly = getUrlParameter('modsOnly');

    let timeOut = getUrlParameter('timeOut');

    let command = getUrlParameter('command');

    if (!command) {
        command = 'so'; // default
    }

    if (!timeOut) {
        timeOut = 10; // default
    }

    if (!modsOnly) {
        modsOnly = 'true'; // default
    }

    if (!showText) {
        showText = 'true'; // default
    }

    if (!showMsg) {
        showMsg = 'false'; // default
    }

    if (!showImage) {
        showImage = 'false'; // default
    }

    if (channelName === '') {
        alert('channel is not set in the URL');
    }

    // Twitch API get user info for !so command
    let getInfo = function (SOChannel, callback) {
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

    // Twitch API get last game played from a user
    let getStatus = function (SOChannel, callback) {
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

    // If Auth token is set, then connect to chat using oauth, else connect anonymously.
    if (ref) {
        client = new tmi.Client({
            options: {
                debug: true,
                skipUpdatingEmotesets: true
            },
            connection: {reconnect: true},
            identity: {
                username: channelName,
                password: 'oauth:' + atob(ref)
            },
            channels: [channelName]
        });
    } else {
        client = new tmi.Client({
            options: {
                debug: true,
                skipUpdatingEmotesets: true
            },
            connection: {reconnect: true},
            channels: [channelName]
        });
    }

    client.connect().catch(console.error);

    // triggers on message
    client.on('chat', (channel, user, message, self) => {

        // Ignore echoed messages.
        if (self) {
            return false;
        }

        if (user['message-type'] === 'chat' && message.startsWith('!')) {
            let getChannel;
            let titleText;

            // Ignore echoed messages.
            if (self) return;

            if (message.startsWith('!' + command)) {

                // Ignore if video clip is playing
                if (document.getElementById("clip") || document.getElementById("text-container")) {
                    return false; // Exit and Do nothing
                }

                getChannel = message.substr(command.length + 1);
                getChannel = getChannel.replace('@', '');
                getChannel = getChannel.trim();
                getChannel = getChannel.toLowerCase();
                console.log(getChannel);

                // Create an array of channel names
                cmdArray = message.split(' ');
                cmdArray = cmdArray.slice(1);

            } else {
                return false; // Exit and Do nothing else
            }

            if (modsOnly === 'true' && (user.mod || user.username === channelName)) {
                // If is array, then iterate over each channel name. Uses the timeOut value from the URL.
                if (cmdArray.length > 1) {
                    console.log(cmdArray);
                    arrayPlusDelay(cmdArray, function (obj) {
                        console.log('In Array: ' + obj);
                        doShoutOut(obj);
                    }, parseInt(timeOut) * 1000 + 1000); // + 1 seconds, just to be sure that elements are completely removed
                } else {
                    console.log(getChannel);
                    doShoutOut(getChannel); // Mods only
                }
            } else if (modsOnly === 'false' || user.username === channelName) {
                doShoutOut(getChannel); // Everyone
            }

            function doShoutOut(getChannel) {

                getStatus(getChannel, function (info) {
                    // If user exists
                    if (info.data) {

                        // Ignore if video clip is playing
                        if (document.getElementById("clip") || document.getElementById("text-container")) {
                            return false; // Exit and Do nothing
                        }

                        if (showMsg === 'true') {
                            // Say message in chat
                            client.say(channelName.toLowerCase(), "Go check out " + info.data[0]['broadcaster_name'] + "! They were playing: " + info.data[0]['game_name'] + " - " + info.data[0]['title'] + " - https://twitch.tv/" + info.data[0]['broadcaster_login']);
                        }

                        // Show Clip
                        if (showClip === 'true' || showRecentClip === 'true') {

                            getClips(getChannel, '20', function (info) {

                                // If clips exist
                                if (info.data.length > 0) {

                                    console.log('clips exist!');

                                    // Sort array by created_at
                                    info.data.sort(sortByProperty('created_at'));

                                    // Remove existing video element
                                    if (document.getElementById("clip")) {
                                        document.getElementById("clip").remove();
                                    }
                                    if (document.getElementById("text-container")) {
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
                                    $(titleText + "<video id='clip' class='video fade' width='100%' height='100%' autoplay src='" + thumbPart + "'><source src='" + thumbPart + "' type='video/mp4'></video>").appendTo("#container");

                                    // Timeout start
                                    let timer = 0;

                                    // Remove video after timeout has been reached
                                    let startTimer = setInterval(function () {
                                        timer++; // Increment timer

                                        console.log(timer);

                                        if (timer === parseInt(timeOut)) {
                                            // Remove existing video element
                                            if (document.getElementById("clip")) {
                                                document.getElementById("clip").remove();
                                            }
                                            if (document.getElementById("text-container")) {
                                                document.getElementById("text-container").remove();
                                            }
                                            timer = 0; // reset timer to zero
                                            clearInterval(startTimer);
                                        }

                                    }, 1000);

                                    // Remove video element after it has finished playing
                                    document.getElementById("clip").onended = function (e) {
                                        // Remove existing video element
                                        if (document.getElementById("clip")) {
                                            document.getElementById("clip").remove();
                                        }
                                        if (document.getElementById("text-container")) {
                                            document.getElementById("text-container").remove();
                                        }
                                        timer = 0; // reset timer to zero
                                        clearInterval(startTimer);
                                    };

                                } else {

                                    console.log('no clips found!');

                                    if (showImage === 'true') {

                                        console.log('show profile image!');

                                        getInfo(getChannel, function (info) {
                                            let userImage = info.data[0]['profile_image_url'];

                                            // Text on top of clip
                                            if (showText === 'true') {
                                                titleText = "<div id='text-container'><span class='title-text'>Go check out " + info.data[0]['display_name'] + "</span></div>"
                                            } else {
                                                titleText = '';
                                            }

                                            // Profile Image
                                            $(titleText + "<img id='profile' class='fade img-fluid' src='" + userImage + "'>").appendTo("#container");

                                            // Timeout start
                                            let timer = 0;

                                            // Remove Profile Image after timeout has been reached
                                            let startTimer = setInterval(function () {
                                                timer++; // Increment timer

                                                console.log(timer);

                                                if (timer === parseInt(timeOut)) {
                                                    // Remove existing profile image element
                                                    if (document.getElementById("profile")) {
                                                        document.getElementById("profile").remove();
                                                    }
                                                    if (document.getElementById("clip")) {
                                                        document.getElementById("clip").remove();
                                                    }
                                                    if (document.getElementById("text-container")) {
                                                        document.getElementById("text-container").remove();
                                                    }
                                                    timer = 0; // reset timer to zero
                                                    clearInterval(startTimer);
                                                }

                                            }, 1000);
                                        });

                                    } else {

                                        return false; // Exit and Do nothing

                                    }
                                }
                            });
                        }

                    } else {

                        console.log(getChannel + ': Does not exist!');
                        return false;
                    }
                });
            }

        }
    });

});