# Twitch Shout-out overlay

### What is this?

This is a Twitch Shout-Out generator, browser source overlay for OBS.

### Chat command:

!so MrCoolStreamer

### Options

**Show chat message:** Displays a chat message like: "Go check out MrCoolStreamer! They were playing: Retro - Super
Mario Brothers | Some more gaming - https://twitch.tv/mrcoolstreamer"

**Show a random clip:** This will show a random clip from the user that you are shouting out. Pulls the most recent top
20 popular clips.

**Show the most recent clip:** This will show the most recent popular clip.

**Show text on top of clip:** Displays a title on top of the video clip "Go check out MrCoolStreamer".

**Mods only:** Limit the !so to mods and streamer.

### Twitch oAuth token

This overlay requires a Twitch Access token in order to allow your account to post a message into chat.

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