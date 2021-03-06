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

    let vipsOnly = getUrlParameter('vipsOnly');

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

    if (!vipsOnly) {
        vipsOnly = 'false'; // default
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

            // Stop the clips player
            if (message === "!stopclip" && (user.mod || user.username === channelName)) {
                // Reload browser source
                window.location.reload();
            }

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
                cmdArray = message.split('@'); //Split channel names using the @ symbol
                cmdArray = cmdArray.slice(1);
                cmdArray = cmdArray.filter(String);

            } else {
                return false; // Exit and Do nothing else
            }

            if (modsOnly === 'true' && user.mod || user.username === channelName) {

                // Lookup VIPs for the channel
                client.vips(channelName).then((data) => {

                    let isVip = false; // default value
                    console.log(data); // array of vip usernames

                    // If username found in the data array of vip's
                    if (data.lastIndexOf(user.username) !== -1) {
                        isVip = true;
                    }

                    // If is array, then iterate over each channel name. Uses the timeOut value from the URL. Requires @ symbol for each channel name.
                    // Example: !so @teklynk @tekbot_v1 @streamergod @coolstreamer
                    if (cmdArray.length > 1) {

                        console.log(cmdArray);

                        arrayPlusDelay(cmdArray, function (obj) {
                            obj = obj.replace('@', '');
                            obj = obj.trim();
                            obj = obj.toLowerCase();

                            console.log('In Array: ' + obj);

                            if (vipsOnly === 'true' && isVip === true) {
                                console.log('Permissions: VIPs and Streamer only');
                                doShoutOut(obj); // VIPs only and Streamer only
                            } else {
                                console.log('Permissions: Mods and Streamer only');
                                doShoutOut(obj); // Mods and Streamer only
                            }

                        }, parseInt(timeOut) * 1000 + 1000); // + 1 seconds, just to be sure that elements are completely removed

                    } else {

                        console.log(getChannel);

                        if (vipsOnly === 'true' && isVip === true) {
                            console.log('Permissions: VIPs and Streamer only');
                            doShoutOut(getChannel); // VIPs only and Streamer only
                        } else {
                            console.log('Permissions: Mods and Streamer only');
                            doShoutOut(getChannel); // Mods and Streamer only
                        }
                    }
                });

                // Everyone can shout-out
            } else if (modsOnly === 'false' && vipsOnly === 'false') {
                console.log('Permissions: Everyone and Streamer');
                doShoutOut(getChannel); // Everyone and Streamer
            }
        }
    });

    function doShoutOut(getChannel) {

        getStatus(getChannel, function (info) {
            // If user exists
            if (info.data) {

                // Ignore if video clip is playing
                if (document.getElementById("clip") || document.getElementById("text-container")) {
                    return false; // Exit and Do nothing
                }

                if (showMsg === 'true') {
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

                            // Parse thumbnail image to build the clip url
                            let thumbPart = info.data[indexClip]['thumbnail_url'].split("-preview-");
                            thumbPart = thumbPart[0] + ".mp4";

                            // Low clip quality mode
                            if (lowQuality === 'true') {
                                lowQualityVideo = "<source src='" + thumbPart.replace('.mp4', '-360.mp4') + "' type='video/mp4'>";
                            } else {
                                lowQualityVideo = '';
                            }

                            // Text on top of clip
                            if (showText === 'true') {
                                if (customTitle) {
                                    customTitle = getUrlParameter('customTitle').trim();
                                    customTitle = customTitle.replace("{channel}", info.data[0]['broadcaster_name']);
                                    customTitle = customTitle.replace("{url}", "twitch.tv/" + info.data[0]['broadcaster_name'].toLowerCase());
                                    titleText = "<div id='text-container'><span class='title-text'>" + customTitle + "</span></div>"
                                } else {
                                    titleText = "<div id='text-container'><span class='title-text'>Go check out " + info.data[0]['broadcaster_name'] + "</span></div>"
                                }
                            } else {
                                titleText = '';
                            }

                            // Video Clip
                            $(titleText + "<video id='clip' class='video fade' width='100%' height='100%' autoplay>" + lowQualityVideo + "<source src='" + thumbPart + "' type='video/mp4'></video>").appendTo("#container");

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