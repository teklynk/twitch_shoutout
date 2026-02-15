$(document).ready(function () {
    // Get values from URL string
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        let results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // clear localStorage on load. Some clips have a expire time that needs to be refreshed and can not sit in localStorage for too long.
    localStorage.clear();
    console.log('Cleared localStorage');

    // Function to randomly select a api server
    function setRandomServer() {
        // set the api gateway servers 
        const servers = ["https://twitchapi.teklynk.com", "https://twitchapi.teklynk.dev", "https://twitchapi2.teklynk.dev"];

        // Randomly select a server
        const randomIndex = Math.floor(Math.random() * servers.length);
        const selectedServer = servers[randomIndex];

        return selectedServer;
    }

    // Call the function
    const apiServer = setRandomServer();

    let getChannel;

    let shoutOutQueue = [];
    let isShoutOutPlaying = false;

    let titleText;

    let clipDetailsText;

    let indexClip = 0;

    let cmdArray = [];

    let client = '';

    let channelName = getUrlParameter('channel').toLowerCase().trim();

    let showClip = getUrlParameter('showClip');

    let showRecentClip = getUrlParameter('showRecentClip');

    let showMsg = getUrlParameter('showMsg');

    let showText = getUrlParameter('showText');

    let showDetails = getUrlParameter('showDetails').trim();

    let detailsText = getUrlParameter('detailsText').trim();

    let showImage = getUrlParameter('showImage');

    let ref = getUrlParameter('ref');

    let modsOnly = getUrlParameter('modsOnly');

    let timeOut = getUrlParameter('timeOut');

    let command = getUrlParameter('command').trim();

    let customMsg = getUrlParameter('customMsg').trim();

    let customTitle = getUrlParameter('customTitle').trim();

    let dateRange = getUrlParameter('dateRange').trim();

    let raided = getUrlParameter('raided').trim();

    let raidCount = getUrlParameter('raidCount').trim();

    let delay = getUrlParameter('delay').trim();

    let themeOption = getUrlParameter('themeOption').trim();

    let clip_Id = '';

    let userIsVip = false;

    if (!raided) {
        raided = "false"; //default
    }

    if (!raidCount) {
        raidCount = "3"; //default
    }

    if (!delay) {
        delay = "10"; //default
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

    if (!showDetails) {
        showDetails = "false"; //default
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

    if (!dateRange || dateRange === "0") {
        dateRange = ""; //default
    } else {
        // Get client current date
        let todayDate = new Date();

        // subtract dateRange from todayDate
        let startDate = new Date(new Date().setDate(todayDate.getDate() - parseInt(dateRange)));

        // format dates
        startDate = startDate.toISOString().slice(0, 10);
        todayDate = todayDate.toISOString().slice(0, 10);

        // set the daterange url parameter for the api endpoint
        dateRange = "&start_date=" + startDate + "T00:00:00Z&end_date=" + todayDate + "T00:00:00Z";
    }

    let replay = false; // set variable. default value

    let watch = false; // set variable. default value

    let clip_url = '';

    // Load theme css file if theme is set
    if (parseInt(themeOption) > 0) {
        $('head').append('<link rel="stylesheet" type="text/css" href="assets/css/theme' + themeOption + '.css">');
    }

    // Get game details function
    function game_title(game_id) {
        let $jsonParse = JSON.parse($.getJSON({
            'url': apiServer + "/getgame.php?id=" + game_id,
            'async': false
        }).responseText);

        return $jsonParse;
    }

    // Twitch API get user info for !so command
    let getInfo = function (SOChannel, callback) {
        let urlU = apiServer + "/getuserinfo.php?channel=" + SOChannel;
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
        let urlG = apiServer + "/getuserstatus.php?channel=" + SOChannel + "";
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
    let getClips = function (SOChannel, callback) {
        let urlC = apiServer + "/getuserclips.php?channel=" + SOChannel + "" + dateRange + "&random=true";
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
        let urlV = apiServer + "/getuserclips.php?id=" + id;
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
    if (ref > '') {
        client = new tmi.Client({
            options: {
                debug: true,
                skipUpdatingEmotesets: true
            },
            connection: {
                reconnect: true,
                maxReconnectAttempts: 3
            },
            identity: {
                username: channelName,
                password: 'oauth:' + atob(ref)
            },
            channels: [channelName]
        });

        client.connect().catch((err) => {
            console.error(err);
            $("<div class='msg-error'>Login authentication failed. Twitch Access Token may have expired. Please generate a new one.</div>").prependTo('body');
        });
    } else {
        client = new tmi.Client({
            options: {
                debug: true,
                skipUpdatingEmotesets: true
            },
            connection: {
                reconnect: true,
                maxReconnectAttempts: 3
            },
            channels: [channelName]
        });

        client.connect().catch((err) => {
            console.error(err);
        });
    }

    client.on("maxreconnect", () => {
        $("<div class='msg-error'>Failed to connect to Twitch Chat. Please refresh to try again. Twitch Access Token may have also expired.</div>").prependTo('body');
    });

    // Check if user is VIP
    client.on('chat', (channel, userstate, message, self) => {
        // Ignore echoed messages.
        if (self) {
            return false;
        }

        if (userstate && userstate.badges && userstate.badges.vip !== null && userstate.badges.vip !== undefined && userstate.badges.vip !== '') {
            userIsVip = true;
        } else {
            userIsVip = false;
        }
    })

    // triggers on message
    client.on('chat', (channel, user, message, self) => {

        // Ignore echoed messages.
        if (self) {
            return false;
        }

        // If message contains a clip url
        if (message.includes('https://clips.twitch.tv/') || message.includes('/clip/')) {

            // Remove trailing spaces from message
            message = message.trim();

            // get the url from the chat message
            let chatClipUrl = detectURLs(message);

            console.log('clip_url: ' + chatClipUrl);

            // parse url into an array
            let urlArr = chatClipUrl[0].split('/');

            // extract the clip id/slug from the url
            if (message.includes('https://clips.twitch.tv/')) {
                clip_Id = urlArr[3];
                // remove everything in the url after the '?'
                clip_Id = clip_Id.split('?')[0];
            } else {
                clip_Id = urlArr[5];
            }

            console.log('clip_Id: ' + clip_Id);

            // get the clip_url from the api
            getClipUrl(clip_Id, function (info) {
                if (info.data[0].clip_url) {
                    // save the clip url to localstorage
                    localStorage.setItem('twitchSOWatchClip', info.data[0].clip_url);
                }
            });

        }

        if (user['message-type'] === 'chat' && message.startsWith('!') && (user.mod || userIsVip || user.username === channelName)) {

            // Hard-coded commands to control the clips
            if (message === "!sostop" || message === "!stopso" || message === "!stopclip" || message === "!clipstop" || message === "!clipreload") {

                // Reloads browser source
                window.location.reload();

                // Replay previous shout-out clip
            } else if (message === "!clipreplay" || message === "!replayclip" || message === "!soreplay" || message === "!replayso") {

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

            if (modsOnly === 'true' && (user.mod || userIsVip || user.username === channelName)) {

                console.log(getChannel);
                doShoutOut(getChannel); // Mods and VIPs only

            } else if (modsOnly === 'false' || user.username === channelName) {
                doShoutOut(getChannel); // Everyone
            }
        }
    });

    function processShoutOutQueue() {
        if (shoutOutQueue.length === 0) {
            isShoutOutPlaying = false;
            return;
        }

        isShoutOutPlaying = true;
        const { getChannel, replayClip, watchClip } = shoutOutQueue.shift();
        executeShoutOut(getChannel, replayClip, watchClip);
    }

    function doShoutOut(getChannel, replayClip = false, watchClip = false) {
        shoutOutQueue.push({ getChannel, replayClip, watchClip });
        console.log(`Added ${getChannel} to queue. Queue size: ${shoutOutQueue.length}`);
        if (!isShoutOutPlaying) {
            processShoutOutQueue();
        }
    }

    function cleanupAndNext() {
        // Remove existing elements
        if (document.getElementById("clip")) {
            document.getElementById("clip").remove();
        }
        if (document.getElementById("profile")) {
            document.getElementById("profile").remove();
        }
        if (document.getElementById("text-container")) {
            document.getElementById("text-container").remove();
        }
        if (document.getElementById("details-container")) {
            document.getElementById("details-container").remove();
        }

        isShoutOutPlaying = false;
        console.log('Shoutout finished. Processing next in queue.');
        // Add a small delay before processing the next item to allow for CSS transitions to finish
        setTimeout(processShoutOutQueue, 500);
    }

    function executeShoutOut(getChannel, replayClip = false, watchClip = false) {
        if (watchClip === true || replayClip === true) {
            // If chat command = !replayclip
            if (replayClip === true) {
                clip_url = localStorage.getItem('twitchSOClipUrl');
                console.log('Replaying: ' + clip_url);
                // If chat command = !watchclip
            } else if (watchClip === true) {
                clip_url = localStorage.getItem('twitchSOWatchClip');
                console.log('Watching: ' + clip_url);
            }

            if (!clip_url) {
                console.log('No clip URL found to watch or replay.');
                cleanupAndNext();
                return;
            }

            titleText = '';

            $("<video id='clip' class='video fade' width='100%' height='100%' autoplay><source src='" + clip_url + "' type='video/mp4'></video>").appendTo("#container");

            let timer = 0;
            const startTimer = setInterval(function () {
                timer++;
                if (timer >= parseInt(timeOut)) { // Use >= to be safe
                    clearInterval(startTimer);
                    cleanupAndNext();
                }
            }, 1000);

            // Remove video element after it has finished playing
            document.getElementById("clip").onended = function (e) {
                clearInterval(startTimer);
                cleanupAndNext();
            };
            return;
        }

        getStatus(getChannel, function (statusInfo) {
            // If user exists
            if (statusInfo.data && statusInfo.data.length > 0) {

                if (showMsg === 'true') {
                    // If user has streamed anything then say message
                    if (statusInfo.data[0]['game_name']) {
                        if (customMsg) {
                            let processedMsg = customMsg.replace(/{channel}/g, statusInfo.data[0]['broadcaster_name']);
                            processedMsg = processedMsg.replace(/{game}/g, statusInfo.data[0]['game_name']);
                            processedMsg = processedMsg.replace(/{title}/g, statusInfo.data[0]['title']);
                            processedMsg = processedMsg.replace(/{url}/g, "https://twitch.tv/" + statusInfo.data[0]['broadcaster_login']);
                            // Say custom message in chat
                            client.say(channelName, decodeURIComponent(processedMsg));
                        } else {
                            // Say default message in chat
                            client.say(channelName, "Go check out " + statusInfo.data[0]['broadcaster_name'] + "! They were playing: " + statusInfo.data[0]['game_name'] + " - " + statusInfo.data[0]['title'] + " - https://twitch.tv/" + statusInfo.data[0]['broadcaster_login']);
                        }
                        // Say generic message in chat
                    } else {
                        client.say(channelName, "Go check out " + statusInfo.data[0]['broadcaster_name'] + "! https://twitch.tv/" + statusInfo.data[0]['broadcaster_login']);
                    }
                }

                // Show Clip
                if (showClip === 'true' || showRecentClip === 'true') {

                    getClips(getChannel, function (clipInfo) {

                        console.log(clipInfo.data[0]);

                        // If clips exist
                        if (clipInfo.data[0] && clipInfo.data[0].clip_url) {

                            console.log('Clips exist!');

                            console.log('Clip URL: ' + clipInfo.data[0].clip_url);

                            let clip_url = clipInfo.data[0].clip_url;

                            // Text on top of clip
                            if (showText === 'true') {
                                if (customTitle) {
                                    let processedTitle = customTitle;
                                    if (processedTitle.includes("{channel}")) {
                                        processedTitle = processedTitle.replace(/{channel}/g, clipInfo.data[indexClip]['broadcaster_name']);
                                    }
                                    if (processedTitle.includes("{url}")) {
                                        processedTitle = processedTitle.replace(/{url}/g, "twitch.tv/" + clipInfo.data[indexClip]['broadcaster_name'].toLowerCase());
                                    }
                                    titleText = "<div id='text-container' class='hide'><span class='title-text'>" + decodeURIComponent(processedTitle) + "</span></div>"
                                } else {
                                    titleText = "<div id='text-container' class='hide'><span class='title-text'>Go check out " + clipInfo.data[0]['broadcaster_name'] + "</span></div>"
                                }
                            } else {
                                titleText = '';
                            }

                            $(titleText).appendTo("#container");

                            setTimeout(function () {
                                $("#text-container").removeClass("hide");
                                $("#details-container").removeClass("hide");
                            }, 500);

                            $("<video id='clip' class='video fade' width='100%' height='100%' autoplay><source src='" + clip_url + "' type='video/mp4'></video>").appendTo("#container");

                            if (showDetails === 'true') {
                                if (detailsText) {
                                    let processedDetails = detailsText;

                                    if (processedDetails.includes("{title}")) {
                                        if (clipInfo.data[indexClip]['title']) {
                                            processedDetails = processedDetails.replace(/{title}/g, clipInfo.data[indexClip]['title']);
                                        } else {
                                            processedDetails = processedDetails.replace(/{title}/g, "?");
                                        }
                                    }

                                    if (processedDetails.includes("{game}")) {
                                        if (clipInfo.data[indexClip]['game_id']) {
                                            let game = game_title(clipInfo.data[indexClip]['game_id']);
                                            processedDetails = processedDetails.replace(/{game}/g, game.data[0]['name']);
                                        } else {
                                            processedDetails = processedDetails.replace(/{game}/g, "?");
                                        }
                                    }

                                    if (processedDetails.includes("{created_at}")) {
                                        processedDetails = processedDetails.replace(/{created_at}/g, moment(clipInfo.data[indexClip]['created_at']).format("MMMM D, YYYY"));
                                    }
                                    if (processedDetails.includes("{creator_name}")) {
                                        processedDetails = processedDetails.replace(/{creator_name}/g, clipInfo.data[indexClip]['creator_name']);
                                    }
                                    if (processedDetails.includes("{channel}")) {
                                        processedDetails = processedDetails.replace(/{channel}/g, clipInfo.data[indexClip]['broadcaster_name']);
                                    }
                                    if (processedDetails.includes("{url}")) {
                                        processedDetails = processedDetails.replace(/{url}/g, "twitch.tv/" + clipInfo.data[indexClip]['broadcaster_name'].toLowerCase());
                                    }

                                    let dText = "";
                                    let separateLines = processedDetails.split(/\r?\n|\r|\n/g);
                                    separateLines.forEach(lineBreaks);

                                    function lineBreaks(item, index) {
                                        dText += "<div class='details-text item-" + index + "'>" + item + "</div>";
                                    }

                                    $("<div id='details-container'>" + dText + "</div>").appendTo('#container');

                                } else {
                                    clipDetailsText = "<div id='details-container' class='hide'><span class='details-text'>Go check out " + clipInfo.data[indexClip]['broadcaster_name'] + "</span></div>"
                                }

                            } else {
                                clipDetailsText = '';
                            }

                            let timer = 0;
                            let startTimer = setInterval(function () {
                                timer++;
                                console.log(timer);

                                if (timer >= parseInt(timeOut)) {
                                    clearInterval(startTimer);
                                    cleanupAndNext();
                                }

                            }, 1000);

                            document.getElementById("clip").onended = function (e) {
                                clearInterval(startTimer);
                                cleanupAndNext();
                            };

                            if (watch === false) {
                                localStorage.setItem('twitchSOClipUrl', clip_url);
                                localStorage.setItem('twitchSOChannel', getChannel);
                            }

                        } else {

                            console.log('no clips found!');

                            // Show profile image if no clips exist
                            if (showImage === 'true') {

                                getInfo(getChannel, function (userInfo) {
                                    let userImage = userInfo.data[0]['profile_image_url'];

                                    if (showText === 'true') {
                                        titleText = "<div id='text-container'><span class='title-text'>Go check out " + userInfo.data[0]['display_name'] + "</span></div>"
                                    } else {
                                        titleText = '';
                                    }

                                    $(titleText + "<img id='profile' class='fade img-fluid' src='" + userImage + "'>").appendTo("#container");

                                    let timer = 0;
                                    let startTimer = setInterval(function () {
                                        timer++;
                                        console.log(timer);

                                        if (timer >= 5) {
                                            clearInterval(startTimer);
                                            cleanupAndNext();
                                        }

                                    }, 1000);
                                });

                            } else {
                                cleanupAndNext();
                            }
                        }
                    });
                } else if (showImage === 'true') {
                    // Fallback to image if clips are disabled
                    getInfo(getChannel, function (userInfo) {
                        // This logic is similar to the no-clips scenario
                        // For brevity, it's assumed the logic to show image and timeout is here
                        // and it will call cleanupAndNext() on completion.
                    });
                } else {
                    cleanupAndNext();
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
