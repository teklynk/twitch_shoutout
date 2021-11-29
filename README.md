# Twitch Shout-out overlay

### What is this?

This is a Twitch Shout-Out generator, browser source overlay for OBS.

**Chat command:** !so MrCoolStreamer

**Optional chat message:** "Go check out MrCoolStreamer! They were playing: Retro - Super Mario Brothers | Some more
gaming - https://twitch.tv/mrcoolstreamer"

**Optional random clip:** This will show a random clip from the user that you are shouting out. Pulls the most recent
top 20.

**Optional title text:** Displays a title on top of the video clip "Go check out MrCoolStreamer".

### Twitch oAuth token

This overlay requires a Twitch Access token in order to allow your account to post a message into chat.

Tokens can be generated here: [https://twitchtokengenerator.com/](https://twitchtokengenerator.com/)

**When generating a Twitch Access token, be sure to select "Bot Chat Token".**

If you want your bot to reply in chat after a command, I suggest creating tokens using your bots account. To do this,
you will need to sign in to Twitch using your bot account before visiting twitchtokengenerator.