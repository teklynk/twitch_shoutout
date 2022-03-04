# Twitch Shout-out overlay

## What is this?

This is a Twitch Shout-Out generator, browser source overlay for OBS. This project uses [TMIJS](https://tmijs.com/), javascript, html, css. It is client-side code that can run locally (localhost) or on your own server. 

Bug reports and issues can be posted here: [https://github.com/teklynk/twitch_shoutout/issues](https://github.com/teklynk/twitch_shoutout/issues) 

Future development can be tracked here: [https://github.com/teklynk/twitch_shoutout/projects/1](https://github.com/teklynk/twitch_shoutout/projects/1) 

### [Try it here](https://twitch-shoutout.pages.dev/)

## Chat command:

**!so MrCoolStreamer** ***OR*** **!so @MrCoolStreamer** ***OR*** use a custom command.

You can also shout-out multiple channels like: **!so @MrCoolStreamer @WillStreamForBeer @RetroGamer @GamerGamingGames**.
If you have timeOut=20, it will play a shoutout every 20 seconds for each person in the !so command.

This can also be used to play your own clips one after the other. Keep your viewers entertained on your BRB or starting soon scenes. **!so teklynk teklynk teklynk teklynk** Be sure to disable text overlay and chat message. You may want to set this as a seperate browser source with a different shout-out command like: **!brb teklynk teklynk teklynk teklynk**

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

**Shout-out multiple channels with one command:** !so @MrCoolStreamer @WillStreamForBeer @RetroGamer @GamerGamingGames OR !so RetroGamer RetroGamer RetroGamer RetroGamer.

## Notes

* Enable OBS browser source hardware acceleration in Settings -> Advanced in OBS.

* You can not shout-out a user while a clip is playing. You will need to wait for the clip to finish before doing another shout-out command.

## URL Parameters

**channel=Your channel name** 

**showClip=true/false**  Shows a random popular clip.

**showRecentClip=true/false**  Shows the most recent popular clip.

**lowQuality=true/false** Pulls a lower quality video clip... if one is available.

**showImage=true/false**  Shows profile image if no clips exist.

**showMsg=true/false**  Shows a message in chat. ie: "Go check out {channel}! - They were playing: {game} - {title} - https://twitch.tv/channelname"

**showText=true/false**  Shows "Go check out {channel}" on top of the clip.

**modsOnly=true/false**  Limits !so to mods only. If false, everyone can use the !so command.

**timeOut=seconds**  The MAX number of seconds that the clip will play for. Shorter clips will simply end before the timeout and the timeout will reset to zero.

**ref=base64**  Auth token - This is the "obfuscated" auth token. This is only needed if displaying a shout-out message in chat. Please do not share the url with others.

**command=string**  Custom command option: ie: so, soclip, playclip. No need to include the ! symbol.

**customMsg=string** Custom message to display in chat. {channel}, {game}, {title}, {url} are variables that can be used in the custom message.

**customTitle=string** Custom title to display on overlay. {channel}, {url} are variables that can be used in the custom title.

**Example:** http://localhost/twitch_shoutout/shoutout.html?channel=mrcoolstreamer&showClip=true&showRecentClip=false&showMsg=true&showText=true&showImage=true&modsOnly=true&timeOut=10&command=so&lowQuality=true&customMsg={channel}%20is%20awesome!%20Last%20seen%20playing%20{game}%20-%20{title}%20{url}&customTitle=Check%20out%20this%20cool%20streamer%20{channel}%20{url}&ref=abcd1234xyz

## Twitch oAuth token

This overlay requires a Twitch Access token if you want to send a shout-out message in chat.

Tokens can be generated here: [https://twitchtokengenerator.com/](https://twitchtokengenerator.com/)

**When generating a Twitch Access token, be sure to select "Bot Chat Token".**

If you want your bot account to reply in chat after the !so command, I suggest creating tokens using your bots account.
To do this, you will need to sign in to Twitch using your bot account before visiting twitchtokengenerator.

## Custom CSS

Add this CSS to the OBS browser source and modify as needed.

```
video {
    width: 100%;
    height: auto;
    max-height: 100%;
    border-radius: 10px;
}

#text-container {
    width: 100%;
    margin: 40px 0;
    position: absolute;
}

.title-text {
    font-family: Basic, Helvetica, sans-serif;
    font-weight: bold;
    font-size: 5vw;
    word-wrap: break-word;
    color: #fff;
    text-align: center;
    text-shadow: 2px 2px #000;
}
```
```
test
```
