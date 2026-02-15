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
        const servers = ["https://twitchapi.teklynk.com","https://twitchapi.teklynk.dev","https://twitchapi2.teklynk.dev"];

        // Randomly select a server
        const randomIndex = Math.floor(Math.random() * servers.length);
        const selectedServer = servers[randomIndex];

        return selectedServer;
    }

    // Call the function
    const apiServer = setRandomServer();

    let getChannel;

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
            $("<div style='position:absolute;top:0;left:0;width:100%;background:rgba(0,0,0,0.8);color:red;font-size:20px;text-align:center;padding:20px;z-index:10000;'>Login authentication failed. Twitch Access Token may have expired. Please generate a new one.</div>").prependTo('body');
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
        $("<div style='position:absolute;top:0;left:0;width:100%;background:rgba(0,0,0,0.8);color:red;font-size:20px;text-align:center;padding:20px;z-index:10000;'>Failed to connect to Twitch Chat. Please refresh to try again. Twitch Access Token may have also expired.</div>").prependTo('body');
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

            if (modsOnly === 'true' && (user.mod || userIsVip || user.username === channelName)) {
 
                console.log(getChannel);
                doShoutOut(getChannel); // Mods and VIPs only
                
            } else if (modsOnly === 'false' || user.username === channelName) {
                doShoutOut(getChannel); // Everyone
            }
        }
    });

    function doShoutOut(getChannel, replayClip = false, watchClip = false) {

        if (watchClip === true || replayClip === true) {
            // Ignore if video clip is playing
            if (document.getElementById("clip") || document.getElementById("text-container")) {
                console.log('A clip is currently playing. Ignoring !watchclip command until clip is finished');
                return false; // Exit and Do nothing
            }
            // If chat command = !replayclip
            if (replayClip === true) {
                clip_url = localStorage.getItem('twitchSOClipUrl');
                console.log('Replaying: ' + clip_url);
            // If chat command = !watchclip
            } else if (watchClip === true) {
                clip_url = localStorage.getItem('twitchSOWatchClip');
                console.log('Watching: ' + clip_url);
            }

            if (document.getElementById("text-container")) {
                document.getElementById("text-container").remove();
            }
            if (document.getElementById("details-container")) {
                document.getElementById("details-container").remove();
            }

            titleText = '';

            $("<video id='clip' class='video fade' width='100%' height='100%' autoplay><source src='" + clip_url + "' type='video/mp4'></video>").appendTo("#container");

            // Remove video element after it has finished playing
            document.getElementById("clip").onended = function (e) {
                // Remove existing video element
                if (document.getElementById("clip")) {
                    document.getElementById("clip").remove();
                }
                if (document.getElementById("text-container")) {
                    document.getElementById("text-container").remove();
                }
                if (document.getElementById("details-container")) {
                    document.getElementById("details-container").remove();
                }
            };

        }

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
                                client.say(channelName, decodeURIComponent(customMsg));
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

                    getClips(getChannel, function (info) {

                        console.log(info.data[0]);

                        // If clips exist
                        if (info.data[0] && info.data[0].clip_url > '') {

                            console.log('Clips exist!');

                            console.log('Clip URL: ' + info.data[0].clip_url);

                            let clip_url = info.data[0].clip_url;

                            // Remove existing video element
                            if (document.getElementById("clip")) {
                                document.getElementById("clip").remove();
                            }
                            if (document.getElementById("text-container")) {
                                document.getElementById("text-container").remove();
                            }
                            if (document.getElementById("details-container")) {
                                document.getElementById("details-container").remove();
                            }

                            // Text on top of clip
                            if (showText === 'true') {
                                if (customTitle) {
                                    customTitle = getUrlParameter('customTitle').trim();
                                    if (customTitle.includes("{channel}")) {
                                        customTitle = customTitle.replace("{channel}", info.data[indexClip]['broadcaster_name']);
                                    }
                                    if (customTitle.includes("{url}")) {
                                        customTitle = customTitle.replace("{url}", "twitch.tv/" + info.data[indexClip]['broadcaster_name'].toLowerCase());
                                    }
                                    titleText = "<div id='text-container' class='hide'><span class='title-text'>" + decodeURIComponent(customTitle) + "</span></div>"
                                } else {
                                    titleText = "<div id='text-container' class='hide'><span class='title-text'>Go check out " + info.data[0]['broadcaster_name'] + "</span></div>"
                                }
                            } else {
                                titleText = '';
                            }

                            // Render titleText inside text-container
                            $(titleText).appendTo("#container");

                            // Remove the hide class from text-container after a delay
                            setTimeout(function () {
                                $("#text-container").removeClass("hide");
                                $("#details-container").removeClass("hide");
                            }, 500); // wait time

                            // Video Clip
                            $("<video id='clip' class='video fade' width='100%' height='100%' autoplay><source src='" + clip_url + "' type='video/mp4'></video>").appendTo("#container");

                            // Clip details panel
                            if (showDetails === 'true') {
                                if (detailsText) {
                                    
                                    detailsText = getUrlParameter('detailsText').trim();

                                    // Show clip title if it exists
                                    if (detailsText.includes("{title}")) {
                                        if (info.data[indexClip]['title']) {
                                            detailsText = detailsText.replace("{title}", info.data[indexClip]['title']);
                                        } else {
                                            detailsText = detailsText.replace("{title}", "?");
                                        }
                                    }

                                    // Get game name/title using the game_id from the clip's json data
                                    if (detailsText.includes("{game}")) {
                                        // Show game title if it exists
                                        if (info.data[indexClip]['game_id']) {
                                            let game = game_title(info.data[indexClip]['game_id']);
                                            detailsText = detailsText.replace("{game}", game.data[0]['name']);
                                        } else {
                                            detailsText = detailsText.replace("{game}", "?");
                                        }
                                    }

                                    // Format created_at date
                                    if (detailsText.includes("{created_at}")) {
                                        detailsText = detailsText.replace("{created_at}", moment(info.data[indexClip]['created_at']).format("MMMM D, YYYY"));
                                    }
                                    if (detailsText.includes("{creator_name}")) {
                                        detailsText = detailsText.replace("{creator_name}", info.data[indexClip]['creator_name']);
                                    }
                                    if (detailsText.includes("{channel}")) {
                                        detailsText = detailsText.replace("{channel}", info.data[indexClip]['broadcaster_name']);
                                    }
                                    if (detailsText.includes("{url}")) {
                                        detailsText = detailsText.replace("{url}", "twitch.tv/" + info.data[indexClip]['broadcaster_name'].toLowerCase());
                                    }
                                    clipDetailsText = "<div id='details-container' class='hide'><span class='details-text'>" + detailsText + "</span></div>"

                                    let dText = "";

                                    // split on line breaks and create an array
                                    let separateLines = detailsText.split(/\r?\n|\r|\n/g);
                        
                                    // interate over separateLines array
                                    separateLines.forEach(lineBreaks);
        
                                    // generate html for each linebreak/item in array
                                    function lineBreaks(item, index) {
                                        dText += "<div class='details-text item-" + index + "'>" + item + "</div>"; 
                                    }
        
                                    $("<div id='details-container'>" + dText + "</div>").appendTo('#container');

                                } else {
                                    clipDetailsText = "<div id='details-container' class='hide'><span class='details-text'>Go check out " + info.data[indexClip]['broadcaster_name'] + "</span></div>"
                                }
                                
                            } else {
                                clipDetailsText = '';
                            }

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
                                    if (document.getElementById("details-container")) {
                                        document.getElementById("details-container").remove();
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
                                if (document.getElementById("details-container")) {
                                    document.getElementById("details-container").remove();
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

                                        // hardcoded timer value. This timer is idependent of the timeOut url param.
                                        if (timer === 5) {
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
                                            if (document.getElementById("details-container")) {
                                                document.getElementById("details-container").remove();
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
