const uuidv4 = require('uuid/v4');
const { naughtyToNice, hasBlacklistedWord } = require( './censor' );
const { parseEmotes, whitespaceRegex } = require( './emotes' );
const languages = require( './languages' );
const langDetect = require("@chattylabs/language-detection");
const maxMessageLength = 64;
const memTranslations = [];
const memLimit = 1000;
const twitchUsernameRegex = /@[a-zA-Z0-9_]{4,25}\b/gi
let translationCalls = 0;

function translateMessage( channel, userstate, message, app ) {
  try {
    const { translations, request, channels } = app
    const language = channels[ channel ].lang;
    const ignore = channels[ channel ].ignore || {};
    // User filtering
    if( userstate.username && ignore[ userstate.username ] ) return;

    // Check if the language is already the target language
    const result = langDetect( message );
    if( result.language === language ) return;

    // Blacklist filtering
    if( hasBlacklistedWord( message ) ) return;

    // Parsing for emotes
    let filteredMessage = message
    if( userstate.emotes ) {
      filteredMessage = parseEmotes( userstate.emotes, filteredMessage );
    }
    filteredMessage = filteredMessage
      .replace( twitchUsernameRegex, '' )
      .replace( whitespaceRegex, ' ' )
      .trim()

    if( !filteredMessage ) return;

    // Caching
    if( filteredMessage.length < maxMessageLength ) {
      // Attempt to retrieve from cache
      const resp = translations.get( filteredMessage ) || undefined;
      if( resp && resp[ language ] )
        return sendTranslationFromResponse( language, filteredMessage, channel, userstate, resp, app )
    } else {
      // Check memTranslations for long-message caches
      const resp = memTranslations.find( translation => translation.message == filteredMessage )
      if( resp && resp[ language ] )
        return sendTranslationFromResponse( language, filteredMessage, channel, userstate, resp, app )
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
            sendTranslationFromResponse( language, filteredMessage, channel, userstate, resp, app, true );
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
  catch( err ) {
	  return;
  }
}

function translateMessageWithAzure( channel, userstate, message, app ) {
  {
    const { translations, request, channels } = app
    const language = channels[ channel ].lang;
    const ignore = channels[ channel ].ignore || {};
    // User filtering
    if( userstate.username && ignore[ userstate.username ] ) return;

    // Check if the language is already the target language
    // const result = langDetect( message );
    // if( result.language === language ) return;

    // Blacklist filtering
    if( hasBlacklistedWord( message ) ) return;

    // Parsing for emotes
    let filteredMessage = message
    if( userstate.emotes ) {
      filteredMessage = parseEmotes( userstate.emotes, filteredMessage );
    }
    filteredMessage = filteredMessage
      .replace( twitchUsernameRegex, '' )
      .replace( whitespaceRegex, ' ' )
      .trim()

    // console.log( filteredMessage );

    if( !filteredMessage ) return;

    // Caching
    if( filteredMessage.length < maxMessageLength ) {
      // Attempt to retrieve from cache
      const resp = translations.get( filteredMessage ) || undefined;
      if( resp && resp[ language ] )
        return sendTranslationFromResponse( language, filteredMessage, channel, userstate, resp, app )
    } else {
      // Check memTranslations for long-message caches
      const resp = memTranslations.find( translation => translation.message == filteredMessage )
      if( resp && resp[ language ] )
        return sendTranslationFromResponse( language, filteredMessage, channel, userstate, resp, app )
    }

    // Get Translation from translateMessageWithAzure
    let options = {
        method: 'POST',
        baseUrl: 'https://api.cognitive.microsofttranslator.com/',
        url: 'translate',
        qs: {
          'api-version': '3.0',
          'to': [ language ]
        },
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.AZURE_KEY,
          'Content-type': 'application/json',
          'X-ClientTraceId': uuidv4().toString()
        },
        body: [{
              'text': filteredMessage
        }],
        json: true,
    };

    request( options, function( err, res, body ) {
      console.log( err, body, body[ 0 ].translations );
        translationCalls++;
        if( translationCalls % 50 === 0 ) console.log( "API calls" + translationCalls );
        // Error handling
        if( err ) {
          return console.log( "Error in translation request", err );
        }
        try {
          if( body && body.length > 0 ) {
            var resp = {
              text: [ body[ 0 ].translations[ 0 ].text ],
              lang: body[ 0 ].detectedLanguage.language
            };
            sendTranslationFromResponse( language, filteredMessage, channel, userstate, resp, app, true );
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
    });
  }
}

function sendTranslationFromResponse( language, filteredMessage, channel, userstate, resp, app, fromRequest = false ) {
  const { client, channels } = app
  const { uncensored, color, langshow } = channels[ channel ]
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

  client.say( channel, `${ color ? "/me " : "" }${ langshow ? "(" + languages[ langFrom.split("-")[ 0 ] ] + ") " : "" }${ userstate[ "display-name" ] }: ${ text }` );
}

module.exports = { translateMessage, translateMessageWithAzure }
