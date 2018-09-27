# ChatterboxTranslatorBot
We built this ChatterboxTranslator as a Twitch Bot live on Twitch!

## Instafluff ##
> *Come and hang out with us at the Comfiest Corner on Twitch!*

> https://twitch.tv/instafluff

> https://twitter.com/instafluffTV

## Info ##

Real-time Translation of Twitch Chat

Description: This bot detects and translates chat messages of other languages into the target language set by the streamer in real-time.

Commands: (Commands are only allowed by the Streamer and Moderators)
!join - Used only from twitch.tv/ChatTranslator by the streamer to have the bot join the channel
!languagelist / !langhelp - Prints out available commands for this Bot
!language [code] / !lang [code] - Sets the target language for the channel using a language code (e.g. en for English)
!languagestop / !langstop - Makes the Bot leave the channel
!languagelist / !langlist - Prints a list of available languages for Translation
!languagecolor / !langcolor - Toggles the translated text color between normal chat and /me action.

## Credits ##
Thank you to all the participants of this project!

**MacabreMan2, Instafluff, Soldi3rGam3r, That_MS_Gamer, Instafriend, Polarami, kingswerv, ItsNaomiArt, BountyHunterLani, OhScee, DVM59, samchitto, lizardqueen, therealoliveryoutuber, Kara_Kim, raleenakaos, nightsilas, stresstest, malfunct, Amarogine, kaisuke, Deitypotato, HeyOhKei, GeoRevilo, mallesbixie, MalForTheWin, teemerae, CrimsonKnightZero, jellydance, QeraiX, momokohyhy, slfhighfive, VanityShowcase, MerlinLeWizard, FuriousFur, ANGRYPASTA9999, Nordegraf, MisterHex, wietlol, sparky_pugwash, dinnsdale, Xynal, Ellesria, LamerYo, Neo_TA, Mikeystea, DJCarmichael, Yenyon, ChatTranslator, GSOcreative, where_is_laughingman, Liayda, Motabor, knugensugen**

And to the participants who helped make this bot a reality!

**Instafluff, sethorizer, MacabreMan2, rarephoenixgames, That_MS_Gamer, Amarogine, Thedudeskee, teemerae, ItsNaomiArt, Kyoslilmonster, Instafriend, nyasaki_de, Meralaz, BillNash, kingswerv, neniltheelf, AntiViGames, Dionysus_Rex, BountyHunterLani, wietlol, therealoliveryoutuber, nightsilas, CrimsonKnightZero, HabuSai, Deitypotato, Atlas_Theta, HuntedThompson, GeoRevilo, HookshotJohn, malfunct, ChatTranslator, MrRayKoma, vic_likadabooty, where_is_laughingman, Mikeystea, sparky_pugwash, CaseyGeske, jellydance, benpoopooface, Neo_TA, Krakka25, Nrwgn_VKNG, DutchGamer46, BungalowGlow, SimmeringSoupPot, MisterHex, tsmilesxd, pikacupcake, MrBoombati, ArtfortheApocalypse, mightygabs, xSAFFIREx, Abbyfabby, cottonsmiles, CptCheerios, Imperialgrrl, pawsitivelystitched, LadyAvianna, AirForceKitty, Shaosan, MollieMcGee, Aleal42, opensource360, FraaOrolo, L33tingL4dy, CriticalKnit, iglookid, KitAnnLIVE, minikatkat, 急須, sebiyy, doombreakers, ThoraxSempai, anonymous__31, ユリシーズ, doyourememberthepickle, GSOcreative, Kara_Kim, Polarami, mallesbixie, Liayda, Khaled__, Inventus1, Teapup, and BongoCat**

and to all the people that helped optimize the bot and add word-filtering for only the nicest words!

**MacabreMan2, Instafriend, Instafluff, wietlol, Neo_TA, That_MS_Gamer, pipskidoodle, jellydance, Kyoslilmonster, Lichsmash, Polarami, InSanityParty, neniltheelf, MrRayKoma, Stay_Hydrated_Bot, MerlinLeWizard, Mikeystea, carbon_add, lizardqueen, ItsNaomiArt, sparky_pugwash, lastleap, vic_likadabooty, BountyHunterLani, blackdawn1980, mrPlus, vPositive, shinageeexpress, GeoRevilo, The_Modern_Alchemist, Sum_Wun, PokemoHero, TheArtofDHT, madridr4, letchik322, FlyToto_, ChatTranslator, flappieh, Kara_Kim, FuriousFur, AgroKragle, Deitypotato, JustRandomGamess, AlexHicks, Gwozilla, Leemyy, QeraiX, BOSSTIEN, CriticalKnit**

## Instructions ##

1. Install NodeJS - [https://nodejs.org/en/](https://nodejs.org/en/)
2. Open the directory in a Command Prompt/Terminal
3. Install Dependencies: `npm install`
4. Get a Twitch Chat OAuth Password Token - [http://twitchapps.com/tmi/](http://twitchapps.com/tmi/)
4. Create a file named `.env` that looks like this:
```javascript
PORT=8000
TWITCHUSER=[YOUR-USERNAME-HERE]
OAUTH=[YOUR-OAUTH-PASS HERE] # e.g. OAUTH=oauth:kjh12bn1hsj78445234
```
5. Run Server: `npm start`
6. View the webpage from your web browser! [http://localhost:8000](http://localhost:8000)
