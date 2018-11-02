require( 'dotenv' ).config();
const fs = require( 'fs' );
const TwitchJS = require( 'twitch-js' );
const translate = require( 'google-translate-api' );
const request = require( 'request' );
const Storage = require( 'node-storage' );
const { naughtyToNice, hasBlacklistedWord } = require( './censor' );
const { parseEmotes } = require( './emotes' );

const store = new Storage( "channels.db" );
const translations = new Storage( "translations.db" );
const maxMessageLength = 64;
const memTranslations = [];
const memLimit = 1000;

const channels = store.get( "channels" ) || {};
const defaultLang = "en";
const botChannelName = "#" + process.env.TWITCHUSER;
const channelList = Object.keys( channels );
channelList.push( botChannelName );
const prefix = '!'
const prefixRegex = new RegExp( '^' + prefix )
let translationCalls = 0;

const client = new TwitchJS.client( {
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
} );
client.on( 'chat', onMessage );
client.on( 'connected', ( address, port ) => console.log( `Connected: ${ address }:${ port }` ) );
client.on( 'reconnect', () => console.log( 'Reconnecting' ) );
client.connect();

function onMessage( channel, userstate, message, self ) {
  if( self ) return;

  if( message.match( prefixRegex ) ) {
    runCommand( channel, userstate, message )
  } else if( channels[ channel ] ) {
    translateMessage( channel, userstate, message )
  }
}

function runCommand( channel, userstate, message ) {
  const userChannel = "#" + userstate.username;
  const isBroadcaster = userChannel == channel;
  const isMod = userstate.mod;
  const channelConfig = channels[ channel ]
  const command = message.replace( prefixRegex, '' ).toLowerCase()

  // Join request in home channel
  if( channel == botChannelName ) {
    switch( command ) {
      case "join":
        if( !channels[ userChannel ] ) {
          client.join( userChannel ).then( ( data ) => {
            channels[ data ] = { lang: defaultLang };
            store.put( "channels", channels );
            client.say( userChannel, "/me Hello! I am ready to translate" );
          } );
          client.say( channel, "/me Okay, " + userstate[ "display-name" ] );
        }
        return;
    }
  }

  // Bot managment
  if( isBroadcaster || isMod ) {
    if( message.startsWith( "!lang " ) || message.startsWith( "!language " ) ) {
      const targetLanguage = message.split( " " )[ 1 ].trim();
      if( translate.languages.isSupported( targetLanguage ) ) {
        channelConfig.lang = translate.languages.getCode( targetLanguage );
        client.say( channel, "/me Language was set to " + translate.languages[ channelConfig.lang ] );
      }
      return;
    }
    switch( command ) {
      case "languagelist":
      case "langlist":
        const supportedlanguages = Object.keys( translate.languages ).filter( lang => lang != "auto" && lang != "isSupported" && lang != "getCode" ).join( ", " );
        return client.say( channel, "My supported languages are: " + supportedlanguages );
      case "languagecensor":
      case "langcensor":
        channelConfig.uncensored = !channelConfig.uncensored;
        store.put( "channels", channels );
        return client.say( channel,
          channelConfig.uncensored
            ? "ChatTranslator will now allow NAUGHTY words."
            : "ChatTranslator will now only allow NICE words."
        );
      case "languagestop":
      case "langstop":
        delete channels[ channel ];
        store.put( "channels", channels );
        client.say( channel, "Goodbye!!!" );
        return client.part( channel );
      case "languagecolor":
      case "langcolor":
        channelConfig.color = !( channelConfig.color || true );
        store.put( "channels", channels );
        return client.say( channel, "Chat color was " + ( channelConfig.color ? "ENABLED" : "DISABLED" ) );
      case "languagehelp":
      case "langhelp":
        return client.say( channel, "My commands are !lang [language], !langlist, !langcolor, !langstop" );
    }
  }
}

function translateMessage( channel, userstate, message ) {
  {
    const language = channels[ channel ].lang;

    // Blacklist filtering
    if( hasBlacklistedWord( message ) ) return;

    // Parsing for emotes
    let filteredMessage = message
    if( userstate.emotes ) {
      filteredMessage = parseEmotes( userstate.emotes, filteredMessage );
    }

    if( !filteredMessage ) return;

    // Caching
    if( filteredMessage.length < maxMessageLength ) {
      // Attempt to retrieve from cache
      const resp = translations.get( filteredMessage ) || undefined;
      if( resp && resp[ language ] )
        return sendTranslationFromResponse( language, filteredMessage, channel, userstate, resp )
    } else {
      // Check memTranslations for long-message caches
      const resp = memTranslations.find( translation => translation.message == filteredMessage )
      if( resp && resp[ language ] )
        return sendTranslationFromResponse( language, filteredMessage, channel, userstate, resp )
    }

    // Get Translation from yandex
    request.get(
      "https://translate.yandex.net/api/v1.5/tr.json/translate?key=" + process.env.YANDEX_KEY + "&lang=" + language + "&text=" + encodeURI( filteredMessage ),
      ( err, res, body ) => {
        translationCalls++;
        if( translationCalls % 50 === 0 ) console.log( "API calls" + translationCalls );
        // Error handling
        if( err ) {
          return console.log( "Error in translation request", err );
        }
        try {
          const resp = JSON.parse( body );
          if( resp && resp.lang ) {
            sendTranslationFromResponse( language, filteredMessage, channel, userstate, resp, true );
            // Cache translation
            if( filteredMessage.length < maxMessageLength ) {
              const translation = translations.get( filteredMessage ) || {};
              translation[ language ] = resp;
              translations.put( filteredMessage, translation );
            }
            else {
              if( memTranslations.length >= memLimit ) {
                memTranslations.splice( 0, 1 );
              }
              memTranslations.push( {
                message: filteredMessage,
                [ language ]: resp
              } );
            }
          }
        } catch( e ) {
          console.log( e );
        }
      } );
  }
}

function sendTranslationFromResponse( language, filteredMessage, channel, userstate, resp, fromRequest = false ) {
  const { uncensored, color } = channels[ channel ]
  let text, langFrom;

  if( fromRequest ) {
    text = resp.text[ 0 ] || "";
    langFrom = resp.lang;
  } else {
    text = resp[ language ].text[ 0 ] || "";
    langFrom = resp[ language ].lang;
  }

  if( !langFrom || langFrom.startsWith( language ) ) return

  // No need to send duplicate in same language
  if( text == filteredMessage ) {
    return;
  }
  // Censoring
  if( !uncensored ) {
    text = naughtyToNice( text );
  }

  client.say( channel, `${ color ? "/me " : "" }${ userstate[ "display-name" ] }: ${ text }` );
}
