require( 'dotenv' ).config();
const fs = require( 'fs' );
const TwitchJS = require( 'twitch-js' );
const translate = require( 'google-translate-api' );
const request = require( 'request' );
const Storage = require( 'node-storage' );

const store = new Storage( "channels.db" );
const translations = new Storage( "translations.db" );
const maxMessageLength = 64;
const naughtylist = fs.readFileSync( "facebook-bad-words-list_comma-separated-text-file_2018_07_29.txt", "utf8" ).split( ", " );
const globalblacklist = fs.readFileSync( "blacklist.txt", "utf8" ).split( "\n" );
const memTranslations = [];
const memLimit = 1000;

const channels = store.get( "channels" ) || {};
const defaultLang = "en";
const channelList = Object.keys( channels );
channelList.push( "#" + process.env.TWITCHUSER );
let translationCalls = 0;

const options = {
  options: {
    debug: false
  },
  connection: {
    reconnect: true,
  },
  channels: channelList,
  identity: {
    username: process.env.TWITCHUSER,
    password: process.env.OAUTH
  },
};

const emoteRegex = /^[a-z][a-z\d]*[A-Z][\w\d]*/g
const isEmoteTest = str => str.match( emoteRegex )
const isNotEmoteTest = str => !str.match( emoteRegex )

const client = new TwitchJS.client( options );

client.on( 'chat', onMessage );
client.connect();

function onMessage( channel, userstate, message, self ) {
  let isBroadcaster = ( "#" + userstate[ "username" ] ) == channel;
  let isMod = userstate[ "mod" ];
  let userChannel = "#" + userstate[ "username" ];
  if( self ) return;

  if( channel == "#" + process.env.TWITCHUSER ) {
    switch( message ) {
      case "!join":
        if( !channels[ userChannel ] ) {
          client.join( userChannel ).then( ( data ) => {
            channels[ data ] = { "lang": defaultLang };
            store.put( "channels", channels );
            client.say( userChannel, "/me Hello! I am ready to translate" );
          } );
          client.say( channel, "/me Okay, " + userstate[ "display-name" ] );
        }
        break;
    }
  }

  if( isBroadcaster || isMod ) {
    if( message.startsWith( "!lang " ) || message.startsWith( "!language " ) ) {
      const targetLanguage = message.split( " " )[ 1 ].trim();
      if( translate.languages.isSupported( targetLanguage ) ) {
        channels[ channel ][ "lang" ] = translate.languages.getCode( targetLanguage );
        client.say( channel, "/me Language was set to " + translate.languages[ channels[ channel ][ "lang" ] ] );
      }
      return;
    }
    switch( message ) {
      case "!languagelist":
      case "!langlist":
        const supportedlanguages = Object.keys( translate.languages ).filter( lang => lang != "auto" && lang != "isSupported" && lang != "getCode" ).join( ", " );
        client.say( channel, "My supported languages are: " + supportedlanguages );
        break;
      case "!languagecensor":
      case "!langcensor":
        channels[ channel ][ "uncensored" ] = !( channels[ channel ][ "uncensored" ] || false );
        store.put( "channels", channels );
        if( channels[ channel ][ "uncensored" ] ) {
          client.say( channel, "ChatTranslator will now allow NAUGHTY words." );
        }
        else {
          client.say( channel, "ChatTranslator will now only allow NICE words." );
        }
        break;
      case "!languagestop":
      case "!langstop":
        delete channels[ channel ];
        store.put( "channels", channels );
        client.say( channel, "Goodbye!!!" );
        client.part( channel );
        break;
      case "!languagecolor":
      case "!langcolor":
        channels[ channel ][ "color" ] = !( channels[ channel ][ "color" ] || true );
        store.put( "channels", channels );
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
    if( message.startsWith( "!" ) ) return;
    if( channel === "#instafluff" && message === "hahahahahahaha" ) {
      client.say( channel, ( channels[ channel ][ "color" ] ? "/me " : "" ) + userstate[ "display-name" ] + " said, \"depression.\"" );
      return;
    }

    const emotes = message.split( " " ).filter( isEmoteTest );
    const filteredMessage = message.split( " " ).filter( isNotEmoteTest ).join( " " );

    // Check for an emote-only message
    if( filteredMessage.length == 0 ) {
      return;
    }

    const messageLC = filteredMessage.toLowerCase();
    for( let i = 0; i < globalblacklist.length; i++ ) {
      const word = globalblacklist[ i ];
      if( word && messageLC.startsWith( word ) ) return;
    }

    if( filteredMessage.length < maxMessageLength ) {
      // Attempt to retrieve from cache
      const resp = translations.get( filteredMessage ) || undefined;
      if( resp && resp[ language ] ) {
        let text = resp[ language ][ "text" ][ 0 ] || "";
        let langFrom = resp[ language ][ "lang" ];
        if( langFrom && !langFrom.startsWith( language ) ) {
          if( text == filteredMessage ) return; // No need to translate back to itself
          if( !channels[ channel ][ "uncensored" ] ) text = naughtyToNice( text );
          client.say( channel, ( channels[ channel ][ "color" ] ? "/me " : "" ) + userstate[ "display-name" ] + ": " + text );
        }
        return;
      }
    }
    else {
      // Check memTranslations for long-message caches
      for( let i = 0; i < memTranslations.length && i < memLimit; i++ ) {
        if( memTranslations[ i ][ "message" ] == filteredMessage ) {
          const resp = memTranslations[ i ];
          if( resp && resp[ language ] ) {
            let text = resp[ language ][ "text" ][ 0 ] || "";
            let langFrom = resp[ language ][ "lang" ];
            if( langFrom && !langFrom.startsWith( language ) ) {
              if( text == filteredMessage ) return; // No need to translate back to itself
              if( !channels[ channel ][ "uncensored" ] ) text = naughtyToNice( text );
              client.say( channel, ( channels[ channel ][ "color" ] ? "/me " : "" ) + userstate[ "display-name" ] + ": " + text );
            }
            return;
          }
        }
      }
    }

    request.get( "https://translate.yandex.net/api/v1.5/tr.json/translate?key=" + process.env.YANDEX_KEY + "&lang=" + language + "&text=" +
      encodeURI( filteredMessage ), ( err, res, body ) => {
        translationCalls++;
        // console.log( "Translated x" + translationCalls );
        try {
          const resp = JSON.parse( body );
          if( resp && resp[ "lang" ] ) {
            let text = resp[ "text" ][ 0 ] || "";
            let langFrom = resp[ "lang" ];
            if( langFrom && !langFrom.startsWith( language ) ) {
              if( text == filteredMessage ) return; // No need to translate back to itself
              if( !channels[ channel ][ "uncensored" ] ) text = naughtyToNice( text );
              client.say( channel, ( channels[ channel ][ "color" ] ? "/me " : "" ) + userstate[ "display-name" ] + ": " + text );
            }
            if( filteredMessage.length < maxMessageLength ) {
              const translation = translations.get( filteredMessage ) || {};
              translation[ language ] = resp;
              translations.put( filteredMessage, translation );
            }
            else {
              if( memTranslations.length >= memLimit ) {
                memTranslations.splice( 0, 1 );
              }
              const translation = {
                "message": filteredMessage
              };
              translation[ language ] = resp;
              memTranslations.push( translation );
            }
          }
        } catch( e ) {
          console.log( e );
        }
      } );
  }
}

function naughtyToNice( text ) {
  let niceText = text;
  for( let i = 0, len = naughtylist.length; i < len; i++ ) {
    const badword = naughtylist[ i ];
    if( text.includes( badword ) ) {
      if( badword.includes( " " ) ) {
        const regex = new RegExp( naughtylist[ i ], "g" );
        niceText = niceText.replace( regex, "[censored]" );
      }
      else {
        let parts = niceText.split( " " );
        let newText = [];
        for( let i = 0, len = parts.length; i < len; i++ ) {
          if( parts[ i ] == badword ) {
            newText.push( "[censored]" )
          }
          else {
            newText.push( parts[ i ] );
          }
        }
        niceText = newText.join( " " );
      }
    }
  }
  return niceText;
}

function containsNaughtyWord( text ) {
  for( let i = 0; i < naughtylist.length; i++ ) {
    if( text.includes( naughtylist[ i ] ) ) {
      return true;
    }
  }
  return false;
}
