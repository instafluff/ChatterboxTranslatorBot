require( 'dotenv' ).config();

const tmi = require( 'tmi.js' );
const request = require( 'request' );
const fetch = require( "node-fetch" );
const Storage = require( 'node-storage' );
const ComfyDB = require( "comfydb" );

const { runCommand } = require( './command' );
const { translateMessage, translateMessageWithAzure, translateMessageComfyTranslations } = require( './translate' );

const store = new Storage( "channels.db" );
const translations = new Storage( "translations.db" );
const channels = store.get( "channels" ) || {};
const botChannelName = "#" + process.env.TWITCHUSER;
const prefix = '!'
const prefixRegex = new RegExp( '^' + prefix )

function randomSimpleHash( s ) {
	return s.split( "" ).map( c => c.charCodeAt( 0 ) ).reduce( ( p, c ) => p + c, 0 );
}

const serverId = 0;
const serverCount = 1;
let serverChannels = Object.keys( channels ).concat( botChannelName ).filter( x => randomSimpleHash( x ) % serverCount === serverId );
console.log( serverChannels );

(async () => {
	// Check and clean up channels
	for( let i = 0; i < serverChannels.length; i += 100 ) {
		let chans = serverChannels.slice( i, i + 100 ).map( x => x.replace( "#", "" ) );
		let result = await fetch( `https://api.twitch.tv/helix/users?login=${chans.join( "&login=" )}`, {
			headers: {
				"Client-ID": process.env.CLIENT_ID,
				"Authorization": `Bearer ${process.env.API_AUTH}`
			}
		} ).then( r => r.json() );
		let existing = result.data.map( x => x.login );
		let badChans = chans.filter( c => !existing.includes( c ) );
		console.log( "Cleaning bad channels:", badChans );
		badChans.forEach( c => {
			// Leave bad channel
			console.log( "Removing bad channel:", channels[ "#" + c ] );
			delete channels[ "#" + c ];
		});
		store.put( "channels", channels );
	}

	const client = new tmi.Client({
	  options: { debug: false },
	  connection: {
		  secure: true,
		  reconnect: true,
	  },
	  channels: [ botChannelName ].concat( Object.keys( channels ) ),
	  identity: {
		  username: process.env.TWITCHUSER,
		  password: process.env.OAUTH
	  },
	} );
	client.on( 'chat', onMessage );
	client.on( 'connected', ( address, port ) => {
		console.log( `Connected: ${ address }:${ port }` );
	} );
	client.on( 'notice', ( channel, msgid, message ) => {
		console.log( `Notice: ${ channel } ${ msgid } ${ message }` );
		switch( msgid ) {
		case "msg_banned":
			// Leave this channel
			console.log( "Leaving banned channel:", channels[ channel ] );
			delete channels[ channel ];
			store.put( "channels", channels );
			break;
		}
	} );
	client.on( 'reconnect', () => console.log( 'Reconnecting' ) );

	client.connect();
	ComfyDB.Connect();

	const appInjection = { client, prefixRegex, botChannelName, store, channels, translations, request }

	const errorPrefix = "\n[onMessage]  "

	async function onMessage( channel, userstate, message, self ) {
	  if( self ) return;
	  if( userstate.username === "chattranslator" ) return;

	  try {
	    if( message.match( prefixRegex ) ) {
	      runCommand( channel, userstate, message, appInjection )
	    } else if( channels[ channel ] ) {
			// translateMessage( channel, userstate, message, appInjection );
	      await translateMessageWithAzure( channel, userstate, message, appInjection )
		  // translateMessageComfyTranslations( channel, userstate, message, appInjection );
	    }
	  } catch( error ) {
	    console.log(
	      errorPrefix + "Failed handling message!",
	      errorPrefix + "From:  " + userstate.username,
	      errorPrefix + "Message:  " + message,
	      errorPrefix + "Error:  ", error
	    );
	  }
	}
})();
