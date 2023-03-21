# Twitch Shout-out overlay

## What is this?

This is a Twitch Shout-Out generator, browser source overlay for OBS. This project uses [TMIJS](https://tmijs.com/), javascript, html, css. It is client-side code that can run locally (localhost) or on your own server. 

Bug reports and issues can be posted here: [https://github.com/teklynk/twitch_shoutout/issues](https://github.com/teklynk/twitch_shoutout/issues) 

Future development can be tracked here: [https://github.com/teklynk/twitch_shoutout/projects/1](https://github.com/teklynk/twitch_shoutout/projects/1) 

### [Try it here](https://twitch-shoutout.pages.dev/)

## Chat command:

**!so @MrCoolStreamer** **OR** **!so MrCoolStreamer** **OR** use a custom command.

You can also shout-out multiple channels like: **!so @MrCoolStreamer @WillStreamForBeer @RetroGamer @GamerGamingGames**.
If you have timeOut=20, it will play a shout-out every 20 seconds for each person in the !so command.

This can also be used to keep your viewers entertained on your BRB or starting soon scenes. **!so @teklynk @teklynk @teklynk @teklynk** Be sure to disable text overlay and chat message. You may want to set this as a seperate browser source with a different shout-out command like: **!brb @teklynk @teklynk @teklynk @teklynk**

**NEW FEATURES**

**!watchclip** Play a clip that was posted into chat.

**!stopclip** to stop/reload the browser source in case a clip is just way too long, cringey or playing at an inappropriate time. Limited to Mods and Streamer. Can also use (!sostop, !stopso, !stopclip, !clipstop, !clipreload).

**!replayso, !soreplay, !clipreplay, !replayclip** will replay the previous shout-out clip. Maybe you just have to see that clip again :)

## Options

**Show chat message:** Displays a chat message like: "Go check out MrCoolStreamer! They were playing: Retro - Super
Mario Brothers | Some more gaming - https://twitch.tv/mrcoolstreamer"

**Show a random clip:** This will show a random clip from the user that you are shouting out. Pulls the most recent top
20 popular clips.

**Show the most recent clip:** This will show the most recent popular clip.

**Show profile image:** This will show the users profile image if no clips exist.

**Show text on top of clip:** Displays a title on top of the video clip "Go check out MrCoolStreamer".

**Mods only:** Limit the !so to mods and streamer.

**Duration:** Max amount of time that the clip plays for.

**Custom Command:** If not set, the default is: !so.

**Lower Video Quality:** Will pull a lower quality video clip. Some clips may not have a lower quality available.

**Shout-out multiple channels with one command:** !so @MrCoolStreamer @WillStreamForBeer @RetroGamer @GamerGamingGames.

**Automatically shout-out a creator when they raid you:** Viewer count can be adjusted to avoid solo raids.

## Notes

* Enable OBS browser source hardware acceleration in Settings -> Advanced in OBS.

* Be sure to set "Shutdown source when not visible", "Control audio via OBS", "Refresh browser when scene becomes active" on the OBS Browser Source properties.

* You can not shout-out a user while a clip is playing. You will need to wait for the clip to finish before doing another shout-out command.

## URL Parameters

**channel=Your channel name** 

**showClip=true/false**  Shows a random popular clip.

**showRecentClip=true/false**  Shows the most recent popular clip.

**lowQuality=true/false** Pulls a lower quality video clip... if one is available.

**showImage=true/false**  Shows profile image if no clips exist.

**showMsg=true/false**  Shows a message in chat. ie: "Go check out {channel}! - They were playing: {game} - {title} - https://twitch.tv/channelname"

**showText=true/false**  Shows "Go check out {channel}" on top of the clip.

**showDetails=true/false**  Enables the clips details panel on overlay.

**detailsText=string**  Displays custom details about the clips. Can include {channel},{title},{game},{creator_name},{created_at}.

**modsOnly=true/false**  Limits !so to mods only. If false, everyone can use the !so command.

**timeOut=seconds**  The MAX number of seconds that the clip will play for. Shorter clips will simply end before the timeout and the timeout will reset to zero.

**ref=base64**  Auth token - This is the "obfuscated" auth token. This is only needed if displaying a shout-out message in chat. Please do not share the url with others.

**command=string**  Custom command option: ie: so, soclip, playclip. No need to include the ! symbol.

**customMsg=string** Custom message to display in chat. {channel}, {game}, {title}, {url} are variables that can be used in the custom message.

**customTitle=string** Custom title to display on overlay. {channel}, {url} are variables that can be used in the custom title.

**raided=true/false** Enable this to automatically shout-out a creator when they raid you.

**delay=integer** Sets a delay for automatic shout-outs.

**raidCount=integer** Max number of raiders for automatic shout-outs.

**Example:** http://localhost/twitch_shoutout/shoutout.html?channel=mrcoolstreamer&showClip=true&showRecentClip=false&showMsg=true&showText=true&showImage=true&modsOnly=true&timeOut=10&raided=true&delay=10&raidCount=3&command=so&lowQuality=true&customMsg={channel}%20is%20awesome!%20Last%20seen%20playing%20{game}%20-%20{title}%20{url}&customTitle=Check%20out%20this%20cool%20streamer%20{channel}%20{url}&ref=abcd1234xyz

## Twitch oAuth token

This overlay requires a Twitch Access token if you want to send a shout-out message in chat.

Tokens can be generated here: [https://twitchtokengenerator.com/](https://twitchtokengenerator.com/)

**When generating a Twitch Access token, be sure to select "Bot Chat Token".**

If you want your bot account to reply in chat after the !so command, I suggest creating tokens using your bots account.
To do this, you will need to sign in to Twitch using your bot account before visiting twitchtokengenerator.


## If you want to add some flare to the clips info panel and channel name, try this Fancy Slide-in, Slide-out effect.

```css
#text-container {
    top: 0;
    background: #00008890;
    box-shadow: 0 10px #00000090;
    max-width: 100%;
    padding: 4px 0 8px 0;
    border-radius: 25px;
    left: -2000px;
    animation: slide 1s ease forwards;
}

#details-container {
    top: 36vw;
    border-radius: 25px;
    transform: skew(6deg, -6deg);
    margin-left: 0;
    background: #00008890;
    box-shadow: 10px 10px #00000090;
    animation: movein 1s ease forwards, moveout 1s 15s ease forwards;
}

#details-container .details-text.item-0 {
    font-size: 3vw;
    overflow: hidden;
    max-width: 50ch;
    text-overflow: ellipsis;
    white-space: nowrap;
}

#details-container .details-text.item-1 {
    font-size: 2.5vw;
    overflow: hidden;
    max-width: 100ch;
    text-overflow: ellipsis;
    white-space: nowrap;
}

#details-container .details-text.item-2 {
    font-size: 2vw;
}

#details-container .details-text.item-3 {
    font-size: 1.5vw;
}

@keyframes slide {
    100% {left: 0;}
}

@keyframes movein {
  from { left: -2000px; }
  to   { left: 0px; }
}

@keyframes moveout {
  from { left: 0px; }
  to   { left: -2000px; }
}
```