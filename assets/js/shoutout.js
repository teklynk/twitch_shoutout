$(document).ready(function () {
    // Get values from URL string
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

    let getChannel;

    let titleText;

    let cmdArray = [];

    let client = '';

    let lowQualityVideo = '';

    let channelName = getUrlParameter('channel').toLowerCase().trim();

    let showClip = getUrlParameter('showClip');

    let showRecentClip = getUrlParameter('showRecentClip');

    let showMsg = getUrlParameter('showMsg');

    let showText = getUrlParameter('showText');

    let showImage = getUrlParameter('showImage');

    let ref = getUrlParameter('ref');

    let modsOnly = getUrlParameter('modsOnly');

    let timeOut = getUrlParameter('timeOut');

    let command = getUrlParameter('command').trim();

    let lowQuality = getUrlParameter('lowQuality');

    let customMsg = getUrlParameter('customMsg').trim();

    let customTitle = getUrlParameter('customTitle').trim();

    let limit = getUrlParameter('limit').trim();

    let raided = getUrlParameter('raided').trim();

    let raidCount = getUrlParameter('raidCount').trim();

    let delay = getUrlParameter('delay').trim();

    if (!raided) {
        raided = "false"; //default
    }

    if (!raidCount) {
        raidCount = "3"; //default
    }

    if (!delay) {
        delay = "10"; //default
    }

    if (!limit) {
        limit = "20"; //default
    }

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

    if (!lowQuality) {
        lowQuality = 'false'; // default
    }

    if (channelName === '') {
        alert('channel is not set in the URL');
    }

    let replay = false; // set variable. default value

    let watch = false; // set variable. default value

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

    // Twitch API get clip for !watchclip command
    let getClipUrl = function (id, callback) {
        let urlV = "https://twitchapi.teklynk.com/getuserclips.php?id=" + id;
        let xhrV = new XMLHttpRequest();
        xhrV.open("GET", urlV);
        xhrV.onreadystatechange = function () {
            if (xhrV.readyState === 4) {
                callback(JSON.parse(xhrV.responseText));
                return true;
            } else {
                return false;
            }
        };
        xhrV.send();
    };

    // Returns the urls as an array from a chat message(string)
    function detectURLs(chatmsg) {
        let urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
        return chatmsg.match(urlRegex)
    }

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

        // If message contains a clip url
        if (message.startsWith('https://clips.twitch.tv/')) {

            // Remove trailing spaces from message
            message = message.trim();

            // get the url from the chat message
            let chatClipUrl = detectURLs(message);

            // parse url into an array
            let urlArr = chatClipUrl[0].split('/');

            // extract the clip id/slug from the url
            let clip_Id = urlArr[3];

            // remove everything in the url after the '?'
            clip_Id = clip_Id.split('?')[0];

            // get the clip_url from the api
            getClipUrl(clip_Id, function (info) {
                if (info.data[0]['clip_url']) {
                    // save the clip url to localstorage
                    localStorage.setItem('twitchSOWatchClip', info.data[0]['clip_url']);
                }
            });

        }

        if (user['message-type'] === 'chat' && message.startsWith('!') && (user.mod || user.username === channelName)) {

            // Hard-coded commands to control the clips
            if (message === "!sostop" || message === "!stopso" || message === "!stopclip" || message === "!clipstop" || message === "!clipreload") {

                // Reloads browser source
                window.location.reload();

            // Replay previous shout-out clip
            } else if (message === "!clipreplay" || message === "!replayclip" || message === "!soreplay" || message === "!replayso") {

                console.log("Replaying SO");

                watch = false;
                replay = true;

                if (localStorage.getItem('twitchSOChannel') && localStorage.getItem('twitchSOClipUrl')) {
                    doShoutOut(localStorage.getItem('twitchSOChannel'), true, false);
                }

            // Watch a clip from chat
            } else if (message === "!watchclip") {

                console.log("Watching a clip from chat");

                watch = true;
                replay = false;

                if (localStorage.getItem('twitchSOWatchClip')) {
                    doShoutOut(channelName, false, true);
                }

            } else {

                watch = false;
                replay = false;

            }

            // If message starts with custom command + space. !so teklynk
            if (message.startsWith('!' + command + ' ')) {

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
                cmdArray = message.split('@'); //Split channel names using the @ symbol
                cmdArray = cmdArray.slice(1);
                cmdArray = cmdArray.filter(String);

            } else {
                return false; // Exit and Do nothing else
            }

            if (modsOnly === 'true' && (user.mod || user.username === channelName)) {
                // If is array, then iterate over each channel name. Uses the timeOut value from the URL.
                if (cmdArray.length > 1) {
                    console.log(cmdArray);
                    arrayPlusDelay(cmdArray, function (obj) {
                        obj = obj.replace('@', '');
                        obj = obj.trim();
                        obj = obj.toLowerCase();

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
        }
    });

    function doShoutOut(getChannel, replayClip = false, watchClip = false) {

        getStatus(getChannel, function (info) {
            // If user exists
            if (info.data) {

                // Ignore if video clip is playing
                if (document.getElementById("clip") || document.getElementById("text-container")) {
                    return false; // Exit and Do nothing
                }

                if (showMsg === 'true') {
                    if (replay === true || watch === true) {
                        // If replaying or watching a clip, say nothing.
                        client.say(channelName,"");
                    } else {
                        // If user has streamed anything then say message
                        if (info.data[0]['game_name']) {
                            if (customMsg) {
                                customMsg = getUrlParameter('customMsg').trim();
                                customMsg = customMsg.replace("{channel}", info.data[0]['broadcaster_name']);
                                customMsg = customMsg.replace("{game}", info.data[0]['game_name']);
                                customMsg = customMsg.replace("{title}", info.data[0]['title']);
                                customMsg = customMsg.replace("{url}", "https://twitch.tv/" + info.data[0]['broadcaster_login']);
                                // Say custom message in chat
                                client.say(channelName, customMsg);
                            } else {
                                // Say default message in chat
                                client.say(channelName, "Go check out " + info.data[0]['broadcaster_name'] + "! They were playing: " + info.data[0]['game_name'] + " - " + info.data[0]['title'] + " - https://twitch.tv/" + info.data[0]['broadcaster_login']);
                            }
                            // Say generic message in chat
                        } else {
                            client.say(channelName, "Go check out " + info.data[0]['broadcaster_name'] + "! https://twitch.tv/" + info.data[0]['broadcaster_login']);
                        }
                    }

                }

                // Show Clip
                if (showClip === 'true' || showRecentClip === 'true') {

                    getClips(getChannel, limit, function (info) {

                        // If clips exist
                        if (info.data.length > 0) {

                            console.log('clips exist!');

                            // Sort clips array by created_at
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

                            // Get and set variable clip_url from json
                            let clip_url = info.data[indexClip]['clip_url'];

                            // If chat command = !replayclip
                            if (replayClip === true) {
                                clip_url = localStorage.getItem('twitchSOClipUrl');
                                console.log('Replaying: ' + clip_url);
                            // If chat command = !watchclip
                            } else if (watchClip === true) {
                                clip_url = localStorage.getItem('twitchSOWatchClip');
                                console.log('Watching: ' + clip_url);
                            }

                            // Low clip quality mode
                            if (lowQuality === 'true') {
                                lowQualityVideo = "<source src='" + clip_url.replace('.mp4', '-360.mp4') + "' type='video/mp4'>";
                            } else {
                                lowQualityVideo = '';
                            }

                            // Text on top of clip
                            if (showText === 'true') {
                                if (customTitle) {
                                    customTitle = getUrlParameter('customTitle').trim();
                                    customTitle = customTitle.replace("{channel}", info.data[0]['broadcaster_name']);
                                    customTitle = customTitle.replace("{url}", "twitch.tv/" + info.data[0]['broadcaster_name'].toLowerCase());
                                    titleText = "<div id='text-container' class='hide'><span class='title-text'>" + customTitle + "</span></div>"
                                } else {
                                    titleText = "<div id='text-container' class='hide'><span class='title-text'>Go check out " + info.data[0]['broadcaster_name'] + "</span></div>"
                                }
                            } else {
                                titleText = '';
                            }

                            if (watchClip === true) {
                                titleText = '';
                            }

                            // Render text-container
                            $(titleText).appendTo("#container");

                            // Remove the hide class from text-container after a delay
                            setTimeout(function () {
                                $("#text-container").removeClass("hide");
                            }, 600); // wait time

                            // Video Clip
                            $("<video id='clip' class='video fade' width='100%' height='100%' autoplay>" + lowQualityVideo + "<source src='" + clip_url + "' type='video/mp4'></video>").appendTo("#container");

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

                            if (watch === false) {
                                // Save clip url to localstorage so that it can be replayed if needed
                                localStorage.setItem('twitchSOClipUrl', clip_url);
                                localStorage.setItem('twitchSOChannel', getChannel);
                            }

                        } else {

                            console.log('no clips found!');

                            // Show profile image if no clips exist
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

                // If user/channel does not exist
                console.log(getChannel + ': Does not exist!');
                return false;
            }
        });
    }

    // Automatically shout-out channel on raid
    if (raided === "true") {
        client.on("raided", (channel, username, viewers) => {
            // Checks if raid viewer count - default is 3
            if (viewers >= parseInt(raidCount)) {
                // Delay before doing the shout-out to allow for other raid alerts to fire off
                setTimeout(function () {
                    console.log(username + ': is raiding!');
                    console.log(delay + ' second: delay');
                    doShoutOut(username);
                }, parseInt(delay) * 1000);
            }
        });
    }

});
