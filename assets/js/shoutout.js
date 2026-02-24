$(document).ready(async function () {
    // Get values from URL string
    const urlParams = new URLSearchParams(window.location.search);

    // clear sessionStorage on load. Some clips have a expire time that needs to be refreshed and can not sit in sessionStorage for too long.
    sessionStorage.clear();
    console.log('Cleared sessionStorage');

    // Function to randomly select a api server
    async function setRandomServer() {
        let serverArr = [];

        // Custom server url
        let apiServerUrl = (urlParams.get('apiServer') || '').toLowerCase().trim();

        if (apiServerUrl) {
            serverArr = [apiServerUrl];
        } else {
            serverArr = ["https://twitchapi.teklynk.com", "https://twitchapi.teklynk.dev", "https://twitchapi2.teklynk.dev"];
        }

        // set the api gateway servers 
        const servers = serverArr;

        // Shuffle the servers to try them in random order
        for (let i = servers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [servers[i], servers[j]] = [servers[j], servers[i]];
        }

        // Check the server status. If it is down, try the next server.
        for (const server of servers) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                await fetch(server, { method: 'HEAD', signal: controller.signal });
                clearTimeout(timeoutId);
                return server;
            } catch (error) {
                console.warn(`Server ${server} is unreachable. Trying next...`);
            }
        }
        return servers[0];
    }

    // Call the function
    const apiServer = await setRandomServer();

    let getChannel;

    let shoutOutQueue = [];
    let isShoutOutPlaying = false;

    let titleText;

    let clipDetailsText;

    let indexClip = 0;

    let cmdArray = [];

    let client = '';

    let channelName = (urlParams.get('channel') || '').toLowerCase().trim();

    let showClip = urlParams.get('showClip') || '';

    let showRecentClip = urlParams.get('showRecentClip') || '';

    let showMsg = urlParams.get('showMsg') || '';

    let showText = urlParams.get('showText') || '';

    let showDetails = (urlParams.get('showDetails') || '').trim();

    let detailsText = (urlParams.get('detailsText') || '').trim();

    let showImage = urlParams.get('showImage') || '';

    let ref = urlParams.get('ref') || '';

    let modsOnly = urlParams.get('modsOnly') || '';

    let timeOut = urlParams.get('timeOut') || '';

    let command = (urlParams.get('command') || '').trim();

    let customMsg = (urlParams.get('customMsg') || '').trim();

    let customTitle = (urlParams.get('customTitle') || '').trim();

    let dateRange = (urlParams.get('dateRange') || '').trim();

    let raided = (urlParams.get('raided') || '').trim();

    let raidCount = (urlParams.get('raidCount') || '').trim();

    let delay = (urlParams.get('delay') || '').trim();

    let themeOption = (urlParams.get('themeOption') || '').trim();

    let preferFeatured = (urlParams.get('preferFeatured') || '').trim();

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
        timeOut = 60; // default
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

    if (!preferFeatured) {
        preferFeatured = "false"; //default
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
    async function game_title(game_id) {
        const response = await fetch(apiServer + "/getgame.php?id=" + game_id);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    }

    // Twitch API get user info for !so command
    let getInfo = function (SOChannel, callback) {
        let storageKey = SOChannel + "-info";
        if (sessionStorage.getItem(storageKey)) {
            callback(JSON.parse(sessionStorage.getItem(storageKey)));
        } else {
            let urlU = apiServer + "/getuserinfo.php?channel=" + SOChannel;
            fetch(urlU)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    sessionStorage.setItem(storageKey, JSON.stringify(data));
                    callback(data);
                })
                .catch(error => console.error(error));
        }
    };

    // Twitch API get last game played from a user
    let getStatus = function (SOChannel, callback) {
        let storageKey = SOChannel + "-status";
        if (sessionStorage.getItem(storageKey)) {
            callback(JSON.parse(sessionStorage.getItem(storageKey)));
        } else {
            let urlG = apiServer + "/getuserstatus.php?channel=" + SOChannel + "";
            fetch(urlG)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    sessionStorage.setItem(storageKey, JSON.stringify(data));
                    callback(data);
                })
                .catch(error => console.error(error));
        }
    };

    // Twitch API get clips for !so command
    let getClips = function (SOChannel, callback) {
        let urlC;
        if (sessionStorage.getItem(SOChannel)) {
            let data = JSON.parse(sessionStorage.getItem(SOChannel));
            if (data.data && data.data.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.data.length);
                [data.data[0], data.data[randomIndex]] = [data.data[randomIndex], data.data[0]];
            }
            callback(data);
        } else {
            if (preferFeatured !== "false") {
                urlC = apiServer + "/getuserclips.php?channel=" + SOChannel + "&prefer_featured=true&limit=20&shuffle=true" + dateRange;
            } else {
                urlC = apiServer + "/getuserclips.php?channel=" + SOChannel + "&prefer_featured=false&limit=20&shuffle=true" + dateRange;
            }
            fetch(urlC)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(async data => {
                    // If dateRange or preferFeatured is set but no clips are found. Try to pull any clip.
                    if (data.data && data.data.length === 0 && (dateRange > "" || preferFeatured !== "false")) {
                        console.log('No clips found matching dateRange or preferFeatured filter. PULL ANY Clip found from: ' + SOChannel);
                        const response = await fetch(apiServer + "/getuserclips.php?channel=" + SOChannel + "&limit=20&shuffle=true");
                        if (response.ok) {
                            data = await response.json();
                        }
                    }
                    sessionStorage.setItem(SOChannel, JSON.stringify(data));
                    callback(data);
                })
                .catch(error => console.error(error));
        }
    };

    // Twitch API get clip for !watchclip command
    let getClipUrl = function (id, callback) {
        let urlV = apiServer + "/getuserclips.php?id=" + id;
        fetch(urlV)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => callback(data))
            .catch(error => console.error(error));
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
            } else {
                clip_Id = urlArr[5];
            }

            // remove everything in the url after the '?'
            clip_Id = clip_Id.split('?')[0];

            console.log('clip_Id: ' + clip_Id);

            // get the clip_url from the api
            getClipUrl(clip_Id, function (info) {
                if (info.data && info.data[0] && info.data[0].clip_url) {
                    // save the clip url to sessionStorage
                    sessionStorage.setItem('twitchSOWatchClip', info.data[0].clip_url);
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

                if (sessionStorage.getItem('twitchSOChannel') && sessionStorage.getItem('twitchSOClipUrl')) {
                    doShoutOut(sessionStorage.getItem('twitchSOChannel'), true, false);
                }

                // Watch a clip from chat
            } else if (message === "!watchclip") {

                console.log("Watching a clip from chat");

                watch = true;
                replay = false;

                if (sessionStorage.getItem('twitchSOWatchClip')) {
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
                clip_url = sessionStorage.getItem('twitchSOClipUrl');
                console.log('Replaying: ' + clip_url);
                // If chat command = !watchclip
            } else if (watchClip === true) {
                clip_url = sessionStorage.getItem('twitchSOWatchClip');
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

                    getClips(getChannel, async function (clipInfo) {

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
                                            let game = await game_title(clipInfo.data[indexClip]['game_id']);
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
                                sessionStorage.setItem('twitchSOClipUrl', clip_url);
                                sessionStorage.setItem('twitchSOChannel', getChannel);
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
