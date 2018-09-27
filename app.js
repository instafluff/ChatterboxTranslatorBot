require('dotenv').config();
var fs = require('fs');
var TwitchJS = require('twitch-js');
var translate = require('google-translate-api');
var request = require('request');
var Storage = require('node-storage');
var store = new Storage("channels.db");
var globalblacklist = fs.readFileSync( "blacklist.txt", "utf8" ).split( "\n" );

var channels = store.get("channels") || {};
var defaultLang = "en";
var channelList = Object.keys( channels );
channelList.push( "#" + process.env.TWITCHUSER );

// Setup the client with your configuration; more details here:
// https://github.com/twitch-apis/twitch-js/blob/master/docs/Chat/Configuration.md
const options = {
	options: {
		debug: false
	},
	connection: {
		reconnect: true,
	},
  channels: channelList,
  // Provide an identity
  identity: {
    username: process.env.TWITCHUSER,
    password: process.env.OAUTH
  },
};
const client = new TwitchJS.client(options);

// Add chat event listener that will respond to "!command" messages with:
// "Hello world!".
client.on('chat', (channel, userstate, message, self) => {
  let isBroadcaster = ( "#" + userstate[ "username" ] ) == channel;
  let isMod = userstate[ "mod" ];
  let userChannel = "#" + userstate[ "username" ];
  if( self ) return;

  if( channel == "#" + process.env.TWITCHUSER ) {
    switch( message ) {
    case "!join":
      if( !channels[ userChannel ] ) {
        client.join( userChannel ).then((data) => {
          channels[ data ] = { "lang": defaultLang };
          store.put("channels", channels);
          client.say( userChannel, "/me Hello! I am ready to translate" );
        });
        client.say( channel, "/me Okay, " + userstate[ "display-name" ] );
      }
      break;
    }
  }

  if( isBroadcaster || isMod ) {
    if( message.startsWith("!lang ") || message.startsWith("!language ") ) {
      var targetLanguage = message.split(" ")[ 1 ].trim();
      if( translate.languages.isSupported( targetLanguage ) ) {
        channels[ channel ][ "lang" ] = translate.languages.getCode( targetLanguage );
        client.say( channel, "/me Language was set to " + translate.languages[ channels[ channel ][ "lang" ] ] );
      }
      return;
    }
    switch( message ) {
    case "!languagelist":
    case "!langlist":
      var supportedlanguages = Object.keys( translate.languages ).filter( lang => lang != "auto" && lang != "isSupported" && lang != "getCode" ).join(", ");
      client.say( channel, "My supported languages are: " + supportedlanguages );
      break;
    case "!languagestop":
    case "!langstop":
      delete channels[ channel ];
      store.put("channels", channels);
      client.say( channel, "Goodbye!!!" );
      client.part( channel );
      break;
    case "!languagecolor":
    case "!langcolor":
      channels[ channel ][ "color" ] = !( channels[ channel ][ "color" ] || false );
      store.put("channels", channels);
      client.say( channel, "Chat color was " + ( channels[ channel ][ "color" ] ? "ENABLED" : "DISABLED" ) );
      break;
    case "!languagehelp":
    case "!langhelp":
      client.say( channel, "My commands are !lang [language], !langlist, !langcolor, !langstop" );
      break;
    }
  }

  if( channels[ channel ] ) {
    let language = channels[ channel ][ "lang" ];
    if( message.startsWith("!") ) return;
    if( channel === "#instafluff" && message === "hahahahahahaha" ) {
      client.say( channel, ( channels[ channel ][ "color" ] ? "/me " : "" ) + userstate["display-name"] + " said, \"depression.\"" );
      return;
    }
    var messageLC = message.toLowerCase();
    for( var i = 0, len = globalblacklist.length; i < len; i++ ) {
      var word = globalblacklist[ i ];
      if( word && messageLC.startsWith( word ) ) return;
    }

    request.get("https://translate.yandex.net/api/v1.5/tr.json/translate?key=" + process.env.YANDEX_KEY + "&lang=" + language + "&text=" +
			encodeURI( message ), (err, res, body) => {
        let resp = JSON.parse(body);
        if( resp && resp[ "lang" ] ) {
          let text = resp[ "text" ][ 0 ] || "";
          let langFrom = resp[ "lang" ];
          if( langFrom && !langFrom.startsWith( language ) ) {
      			if (text == message) return; // No need to translate back to itself
            if( text.split(" ") )
      			client.say( channel, ( channels[ channel ][ "color" ] ? "/me " : "" ) + userstate["display-name"] + ": " + text );
      		}
        }
      });
  }
});

// Finally, connect to the channel
client.connect();
