$(document).ready(function () {
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        let results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
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

    // URL values
    let mainAccount = getUrlParameter('channel').toLowerCase().trim();
    let limit = getUrlParameter('limit').trim();
    let showText = getUrlParameter('showText').trim();
    let customTitle = getUrlParameter('customTitle').trim();
    let command = getUrlParameter('command').trim();
    let showMsg = getUrlParameter('showMsg').trim();
    let showClip = getUrlParameter('showClip');
    let showRecentClip = getUrlParameter('showRecentClip');
    let showImage = getUrlParameter('showImage');
    let ref = getUrlParameter('ref').trim();
    let customMsg = getUrlParameter('customMsg').trim();
    let timeOut = getUrlParameter('timeOut');
    let modsOnly = getUrlParameter('modsOnly');
    let randomClip = 0; // Default random clip index
    let clip_index = 0; // Default clip index
    let client = '';
    let chatmessage = '';
    let curr_clip = '';
    let titleText = '';
    let timer = 0;
    let showImageTimer = 0;
    let startImageTimer = 0;
    let startTimer;

    if (!modsOnly) {
        modsOnly = 'true'; // default
    }

    if (!command) {
        command = 'so'; // default
    }

    if (!showMsg) {
        showMsg = "false"; //default
    }

    if (!showText) {
        showText = "false"; //default
    }

    if (!limit) {
        limit = "20"; //default
    }

    if (!timeOut) {
        timeOut = 10; // default
    }

    if (showMsg === 'true' && ref === '') {
        alert('Twitch access token not set');
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
                username: mainAccount,
                password: 'oauth:' + atob(ref)
            },
            channels: [mainAccount]
        });
    } else {
        client = new tmi.Client({
            options: {
                debug: true,
                skipUpdatingEmotesets: true
            },
            connection: {reconnect: true},
            channels: [mainAccount]
        });
    }

    client.connect().catch(console.error);

    // triggers on message
    client.on('chat', (channel, user, message, self) => {

        // Ignore echoed messages.
        if (self) {
            return false;
        }

        // Clean message
        chatmessage = message.replace(/(<([^>]+)>)/ig, "").trim();

        // alert message
        if (user['message-type'] === 'chat' && chatmessage.startsWith("!" + command)) {

            // Remove characters and spaces. Lowercase the string
            chatmessage = chatmessage.replace('@', '').trim().toLowerCase();

            // Convert string to an array/list - split on spaces
            // Skip first item in array because the first item is the chat command and not a channel name
            chatmessage = chatmessage.split(' ').slice(1).filter(String);

            // Ignore chat command if already playing a video
            if ($('video').length) {

                console.log('Can not shout-out while a clip is playing!');
                return false;

            } else {
                // Set clip index to 1 if only doing 1 shout-out else force start at index 0
                if (clip_index === chatmessage.length) {
                    clip_index = 1;
                } else {
                    clip_index = 0;
                }

                if (modsOnly === 'true' && (user.mod || user.username === mainAccount)) {
                    loadClip(chatmessage[0]);
                } else if (modsOnly === 'false' || user.username === mainAccount) {
                    loadClip(chatmessage[0]);
                }
            }

        } else {

            return false;
        }

    });

    // Custom title
    function Title(name) {
        // Text on top of clip
        if (showText === 'true') {
            if (customTitle) {
                customTitle = getUrlParameter('customTitle').trim();
                customTitle = customTitle.replace("{channel}", name);
                customTitle = customTitle.replace("{url}", "twitch.tv/" + name.toLowerCase());
                titleText = "<div id='text-container'><span class='title-text'>" + customTitle + "</span></div>";
            } else {
                titleText = "<div id='text-container'><span class='title-text'>Go check out " + name + "</span></div>"
            }

            $(titleText).appendTo('#container');

        } else {
            titleText = '';
        }
    }

    // Get and play the clip
    function loadClip(channelName) {

        let user_json = JSON.parse($.getJSON({
            'url': "https://twitchapi.teklynk.com/getuserinfo.php?channel=" + channelName + "",
            'async': false
        }).responseText);

        if (user_json.data.length === 0) {
            nextClip();
            return false;
        }

        // Show Clip
        if (showClip === 'true' || showRecentClip === 'true') {

            // Set clip index to 1 if only doing 1 shout-out else increment index
            if (clip_index === chatmessage.length) {
                clip_index = 1;
            } else {
                clip_index++;
            }

            // Debug
            console.log('clip_index loadClip: ' + clip_index);
            console.log('message length loadClip: ' + chatmessage.length);

            // Json data - Ajax call
            let clips_json = JSON.parse($.getJSON({
                'url': "https://twitchapi.teklynk.com/getuserclips.php?channel=" + channelName + "&limit=" + limit + "",
                'async': false
            }).responseText);

            if (clips_json.data.length === 0) {
                nextClip();
                return false;
            }

            // If no user clips exist, then skip to the next channel
            if (!clips_json.data || typeof clips_json.data === 'undefined' || clips_json.data.length === 0) {

                console.log('no clips exist for channel: ' + channelName);

                // Do a shout-out message if enabled
                shoutOutMsg(channelName);

                if (showImage === 'true') {

                    console.log('show user profile image');

                    // Remove video element after all shout-outs have ended
                    document.getElementById('container').innerHTML = "";

                    Title(user_json.data[0]['display_name']);

                    $(titleText + "<img id='profile' class='fade img-fluid' src='" + user_json.data[0]['profile_image_url'] + "'>").appendTo("#container");

                    startImageTimer = setInterval(function () {

                        showImageTimer++; // Increment timer
                        console.log(timer);

                        if (showImageTimer === 10) {

                            showImageTimer = 0; // reset timer to zero
                            clearInterval(startImageTimer);

                            console.log('removing profile image');

                            $("img").remove();

                            nextClip();

                        }

                    }, 1000);

                } else {
                    nextClip();
                }
            }

            // Sort array by created_at
            clips_json.data.sort(sortByProperty('created_at'));

            // Grab a random clip index anywhere from 1 to the limit value. Else, grab the most recent popular clip.
            if (showClip === 'true') {
                randomClip = Math.floor((Math.random() * clips_json.data.length - 1) + 1);
            } else {
                randomClip = 0;
            }

            // Remove old video element and text - resets everything
            document.getElementById('container').innerHTML = "";

            // Text on top of clip
            Title(clips_json.data[0]['broadcaster_name']);

            // Create new video element
            curr_clip = document.createElement('video');
            // Append video element to the container div
            $(curr_clip).appendTo('#container');

            // Parse thumbnail image to build the clip url
            let thumbPart = clips_json.data[randomClip]['thumbnail_url'].split("-preview-");
            thumbPart = thumbPart[0] + ".mp4";

            // Load a new clip
            curr_clip.src = thumbPart;
            curr_clip.autoplay = true;
            curr_clip.controls = false;
            curr_clip.volume = 1.0;
            curr_clip.load();

            // Debug
            console.log('channelName: ' + channelName);
            console.log('clipNumber: ' + randomClip);

            // Remove video after timeout has been reached and then play next clip
            startTimer = setInterval(function () {
                timer++; // Increment timer

                console.log(timer);

                if (timer === parseInt(timeOut)) {
                    // Remove existing video element
                    if ($('video').length) {
                        $('video').remove();
                    }

                    if ($('#text-container').length) {
                        $('#text-container').remove();
                    }

                    timer = 0; // reset timer to zero
                    clearInterval(startTimer);

                    nextClip();
                }

            }, 1000);

            // Move to the next clip if the current one finishes playing
            curr_clip.addEventListener("ended", nextClip);
        }

        // Do a shout-out message if enabled
        shoutOutMsg(channelName);

    }

    function shoutOutMsg(channelName) {
        // Do a shout-out for each clip
        if (showMsg === 'true' && ref) {
            let so_json = JSON.parse($.getJSON({
                'url': "https://twitchapi.teklynk.com/getuserstatus.php?channel=" + channelName + "",
                'async': false
            }).responseText);

            // Check if user has streamed anything before doing a shout-out
            if (so_json.data && so_json.data[0]['title']) {
                // Custom message. Replace {variable} with actual values
                if (customMsg) {
                    customMsg = getUrlParameter('customMsg').trim();
                    customMsg = customMsg.replace('{channel}', so_json.data[0]['broadcaster_name']);
                    customMsg = customMsg.replace('{game}', so_json.data[0]['game_name']);
                    customMsg = customMsg.replace('{title}', so_json.data[0]['title']);
                    customMsg = customMsg.replace('{url}', "https://twitch.tv/" + so_json.data[0]['broadcaster_login']);
                    // Say custom message
                    client.say(mainAccount, customMsg);
                } else {
                    // Say default message
                    client.say(mainAccount, "Go check out " + so_json.data[0]['broadcaster_name'] + "! They were playing: " + so_json.data[0]['game_name'] + " - " + so_json.data[0]['title'] + " - https://twitch.tv/" + so_json.data[0]['broadcaster_login']);
                }
            }

        }
    }

    function nextClip() {

        // Reset timer
        timer = 0;
        clearInterval(startTimer);

        if (clip_index === chatmessage.length) {
            // Remove video element after all shout-outs have ended
            document.getElementById('container').innerHTML = "";
            return false;
        }

        console.log('Play The Next Clip!');

        loadClip(chatmessage[clip_index].replace('@', '').trim().toLowerCase());

        curr_clip.play();
    }
});