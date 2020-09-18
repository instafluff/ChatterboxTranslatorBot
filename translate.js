const uuidv4 = require('uuid/v4');
const fetch = require( "node-fetch" );
const ComfyDB = require( "comfydb" );
const fs = require( "fs" );
const ignorelist = fs.readFileSync( "ignore-words.txt", "utf-8" ).split( ", " ).filter( Boolean );
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

	// Ignorelist Filtering
	if( ignorelist.some( w => message.toLowerCase() === w ) ) return;

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

async function translateMessageWithAzure( channel, userstate, message, app ) {
  {
    const { translations, request, channels } = app
    const language = channels[ channel ].lang;
    const ignore = channels[ channel ].ignore || {};
    // User filtering
    if( userstate.username && ignore[ userstate.username ] ) return;

    // Check if the language is already the target language
    const result = langDetect( message );
    if( result.language === language ) return;

	// Ignorelist Filtering
	if( ignorelist.some( w => message.toLowerCase() === w ) ) return;

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
	const cachedTranslation = await ComfyDB.Get( filteredMessage, "translations" ) || undefined;
	if( cachedTranslation && cachedTranslation[ language ] ) {
		console.log( "found cache!", cachedTranslation );
	  return sendTranslationFromResponse( language, filteredMessage, channel, userstate, cachedTranslation, app );
    }

	try {
	    // Get Translation from translateMessageWithAzure
		let body = await fetch( `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${ language }`, {
			method: "POST",
	        headers: {
	          'Ocp-Apim-Subscription-Key': process.env.AZURE_KEY,
	          'Content-type': 'application/json',
	          'X-ClientTraceId': uuidv4().toString()
	        },
			body: JSON.stringify([
				{
	              'text': filteredMessage
		        }
			]),
		} ).then( r => r.json() );
		// TODO: batch translations into single calls by time for performance

		// console.log( body );
      // console.log( body, body[ 0 ].translations );
        translationCalls++;
        if( translationCalls % 50 === 0 ) console.log( "API calls" + translationCalls );

      if( body && body.length > 0 ) {
        var resp = {
          text: [ body[ 0 ].translations[ 0 ].text ],
          lang: body[ 0 ].detectedLanguage.language
        };
        sendTranslationFromResponse( language, filteredMessage, channel, userstate, resp, app, true );

        // Cache translation
		const translation = await ComfyDB.Get( filteredMessage, "translations" ) || {};
		translation[ language ] = resp;
		await ComfyDB.Store( filteredMessage, translation, "translations" );
      }
	}
	catch( err ) {
		return console.log( "Error in translation request", err );
	}
  }
}

const ComfySheets = require( "comfysheets" );
let comfyTranslations = {};

async function loadTranslations() {
	var translationList = await ComfySheets.Read( process.env.SHEETID, 'Form Responses 1', {
		"Original": "message",
		"Original Language": "from",
		"Translation": "translation",
		"Translation Language": "to",
	} );
	translationList.forEach( t => {
		const message = t.message.toLowerCase();
		if( !comfyTranslations[ message ] ) {
			comfyTranslations[ message ] = {
				lang: t.from
			};
		}
		comfyTranslations[ message ][ t.to ] = t.translation;
	});
	console.log( comfyTranslations );
}
async function addTranslation( message, langFrom, translation, langTo ) {
	if( !comfyTranslations[ message ] ) {
		comfyTranslations[ message ] = {
			lang: langFrom.split("-")[ 0 ]
		};
	}
	comfyTranslations[ message ][ langTo ] = translation;
	let result = await ComfySheets.Submit( process.env.FORMID, {
		'entry.364437775': message,
		'entry.1672632710': langFrom.split("-")[ 0 ],
		'entry.1464209519': translation,
		'entry.1190780107': langTo,
	});
}
// loadTranslations();

function translateMessageComfyTranslations( channel, userstate, message, app ) {
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
      const trans = comfyTranslations[ filteredMessage.toLowerCase() ] || undefined;
	  if( trans && trans[ language ] ) {
		  const resp = {
			  [ language ] : {
				text: [ trans[ language ] ],
				lang: trans.lang,
			  }
		  };
		  return sendTranslationFromResponse( language, filteredMessage, channel, userstate, resp, app );
	  }
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
				addTranslation( filteredMessage.toLowerCase(), resp.lang, resp.text[ 0 ], language );
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

module.exports = { translateMessage, translateMessageWithAzure, translateMessageComfyTranslations }
