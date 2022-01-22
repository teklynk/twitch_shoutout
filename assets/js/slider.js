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

    let channelName = getUrlParameter('channel').toLowerCase();
    let channelMessage = getUrlParameter('msg');
    let timeOut = getUrlParameter('timeOut');
    let modsOnly = getUrlParameter('modsOnly');
    let useClips = getUrlParameter('useClips');
    let command = getUrlParameter('command');
    let ref = getUrlParameter('ref');
    let showMsg = getUrlParameter('showMsg');

    let cmdArray = [];

    let client = '';

    if (!command) {
        command = 'so'; // default
    }

    if (!timeOut) {
        timeOut = 20; // default
    }

    if (!useClips) {
        useClips = 'false'; // default
    }

    if (!modsOnly) {
        modsOnly = 'true'; // default
    }

    if (!showMsg) {
        showMsg = 'false'; // default
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

    // Triggers on message
    client.on('chat', (channel, user, message, self) => {

        // Ignore echoed messages.
        if (self) {
            return false;
        }

        let getChannel;

        if (message.startsWith('!' + command)) {

            // Ignore if already displaying a shoutout
            if (document.getElementById("userMsg")) {
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
                    obj = obj.replace('@', '');
                    obj = obj.trim();
                    obj = obj.toLowerCase();
                    console.log('In Array: ' + obj);
                    
                    doShoutOutSlider(obj);
                }, parseInt(timeOut) * 1000 + 1000); // + 1 seconds, just to be sure that elements are completely removed
            } else {
                console.log(getChannel);
                doShoutOutSlider(getChannel); // Mods only
            }
            // Mods only
        } else if (modsOnly === 'false' || user.username === channelName) {
            doShoutOutSlider(getChannel); // Everyone
        }

        function doShoutOutSlider(getChannel) {

            getInfo(getChannel, function (info) {
                // If user exists
                if (info.data.length > 0) {

                    // Ignore if already displaying a shoutout
                    if (document.getElementById("userMsg") || document.getElementById("userImage") || document.getElementById("userName")) {
                        return false; // Exit and Do nothing
                    }

                    // Say message in chat
                    if (showMsg === 'true') {
                        getStatus(getChannel, function (info) {
                            client.say(channelName.toLowerCase(), "Go check out " + info.data[0]['broadcaster_name'] + "! They were playing: " + info.data[0]['game_name'] + " - " + info.data[0]['title'] + " - https://twitch.tv/" + info.data[0]['broadcaster_login']);
                        });
                    }

                    // Remove existing elements on load
                    if (document.getElementById("userMsg")) {
                        document.getElementById("userMsg").remove();
                    }
                    if (document.getElementById("userImage")) {
                        document.getElementById("userImage").remove();
                    }
                    if (document.getElementById("userName")) {
                        document.getElementById("userName").remove();
                    }

                    // Timeout start
                    let timer = 0;

                    // Remove slider elements after timeout has been reached
                    let startTimer = setInterval(function () {
                        timer++; // Increment timer

                        console.log(timer);

                        // If using duration settings
                        if (useClips === 'false' && timer === parseInt(timeOut) && document.getElementById("userMsg")) {

                            //TODO: Add more animation options and move to a function (slide-top-bottom, slide-bottom-top, slide-left, slide-right)
                            // Slide in animation
                            if (document.getElementById("userMsg")) {
                                document.getElementById("userMsg").classList.remove("slide-left-in");
                            }
                            if (document.getElementById("userImage")) {
                                document.getElementById("userImage").getElementsByClassName("image")[0].classList.remove("fade-in-image");
                            }
                            if (document.getElementById("userName")) {
                                document.getElementById("userName").classList.remove("slide-right-in");
                            }

                            // Slide out animation
                            if (document.getElementById("userMsg")) {
                                document.getElementById("userMsg").classList.add("slide-right-out");
                            }
                            if (document.getElementById("userImage")) {
                                document.getElementById("userImage").getElementsByClassName("image")[0].classList.add("fade-out-image");
                            }
                            if (document.getElementById("userName")) {
                                document.getElementById("userName").classList.add("slide-left-out");
                            }

                            // Completely remove elements after 1 second and animation has completed
                            setTimeout(function () {
                                if (document.getElementById("userMsg")) {
                                    document.getElementById("userMsg").remove();
                                }
                                if (document.getElementById("userImage")) {
                                    document.getElementById("userImage").remove();
                                }
                                if (document.getElementById("userName")) {
                                    document.getElementById("userName").remove();
                                }
                                timer = 0; // Reset timer to zero
                                clearInterval(startTimer);
                            }, 500);
                        }

                    }, 1000);

                    let userImage = info.data[0]['profile_image_url'];
                    let userDisplayName = info.data[0]['display_name'];
                    let userMsg = decodeURI(channelMessage);

                    $("<div id='userMsg' class='slide-left-in'><p>" + userMsg + "</p></div>").appendTo("#container");
                    $("<div id='userImage'><img class='image fade-in-image' src='" + userImage + "' alt=''/></div>").appendTo("#container");
                    $("<div id='userName' class='slide-right-in'><p>" + userDisplayName + "</p></div>").appendTo("#container");

                } else {

                    console.log(getChannel + ': Does not exist!');
                    return false;

                }
            });
        }

    })
});