# Twitch Shout-out overlay

### What is this?

This is a Twitch Shout-Out generator, browser source overlay for OBS. This project uses [TMIJS](https://tmijs.com/), javascript, html, css. It is client-side code that can run locally (localhost) or on your own server.

### [Try it here](https://twitch-shoutout.pages.dev/)

### Chat command:

**!so MrCoolStreamer** ***OR*** **!so @MrCoolStreamer** ***OR*** use a custom command.

You can also shout-out multiple channels like: **!so MrCoolStreamer WillStreamForBeer RetroGamer GamerGamingGames**.
If you have timeOut=20, it will play a shoutout every 20 seconds for each person in the !so command.
### Options

**Show chat message:** Displays a chat message like: "Go check out MrCoolStreamer! They were playing: Retro - Super
Mario Brothers | Some more gaming - https://twitch.tv/mrcoolstreamer"

**Show a random clip:** This will show a random clip from the user that you are shouting out. Pulls the most recent top
20 popular clips.

**Show the most recent clip:** This will show the most recent popular clip.

**Show text on top of clip:** Displays a title on top of the video clip "Go check out MrCoolStreamer".

**Mods only:** Limit the !so to mods and streamer.

**Duration:** Max amount of time that the clip plays for.

**Custom Command:** If not set, the default is: !so.

### Notes

You can not shout-out a user while a clip is playing. You will need to wait for the clip to finish before doing another shout-out command.

### URL Parameters

**channel=Your channel name** 

**showClip=true/false**  Shows a random popular clip.

**showRecentClip=true/false**  Shows the most recent popular clip.

**showMsg=true/false**  Shows a message in chat. ie: "Go check out {channel}! - They were playing: {game} - {title} - https://twitch.tv/channelname"

**showText=true/false**  Shows "Go check out {channel}" on top of the clip.

**modsOnly=true/false**  Limits !so to mods only. If false, everyone can use the !so command.

**timeOut=seconds**  The MAX number of seconds that the clip will play for. Shorter clips will simply end before the timeout and the timeout will reset to zero.

**ref=base64**  Auth token - This is the "obfuscated" auth token. Please do not share the url with others.

**command=string**  Custom command option: ie: so, soclip, playclip. No need to include the ! symbol.

### Twitch oAuth token

This overlay requires a Twitch Access token if you want to send a shout-out message in chat.

Tokens can be generated here: [https://twitchtokengenerator.com/](https://twitchtokengenerator.com/)

**When generating a Twitch Access token, be sure to select "Bot Chat Token".**

If you want your bot account to reply in chat after the !so command, I suggest creating tokens using your bots account.
To do this, you will need to sign in to Twitch using your bot account before visiting twitchtokengenerator.

### Custom CSS

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