const translate = require( 'google-translate-api' );
const defaultLang = "en";

const isMod = ( channelName, userstate ) => userstate.mod || "#" + userstate.username == channelName
const isHomeChannel = ( channelName, { botChannelName } ) => channelName == botChannelName

function runCommand( channel, userstate, message, app ) {
  const { prefixRegex, channels } = app
  const command = message.split( /\s/ )[ 0 ].replace( prefixRegex, '' ).toLowerCase()

  if( command in commands ) {
    const commandRunner = commands[ command ]
    if( commandRunner.modOnly && !isMod( channel, userstate ) ) return
    if( commandRunner.homeOnly && !isHomeChannel( channel, app ) ) return
    commandRunner( app, channel, channels[ channel ], userstate, message )
  }
}

const commands = {}
const firstKeys = []
function add( keys, fn, opts = {} ) {
  keys.forEach( key => {
    key = key.toLowerCase()
    if( key in commands ) {
      throw new Error( `${ key } already exists in commands` )
    }
    commands[ key ] = Object.assign( fn, opts )
  } );
  firstKeys.push( Array.from( keys ).sort( ( a, b ) => a.length - b.length )[ 0 ] )
}

function usageMapper( key ) {
  const runner = commands[ key ]
  if( runner.usage ) key = `${ key } ${ runner.usage }`
  return '!' + key
}

add( [ "join" ],
  (
    { channels, store, client },
    channelName,
    _,
    { username, [ "display-name" ]: display },
    message
  ) => {
    const userChannel = "#" + username
    if( !channels[ userChannel ] ) {
      client.join( userChannel )
        .then( ( data ) => {
          const [ , lang = defaultLang ] = message.split( /\s+/ )
          channels[ data ] = {
            lang: lang,
            color: false,
            uncensored: false
          };
          store.put( "channels", channels );
          client.say( userChannel, "/me Hello! I am ready to translate" );
          client.say( channelName, "/me Okay, " + display );
        } )
        .catch( e => {
          client.say( channelName, `@${ username } Something went wrong` );
          console.log( `Something went wrong when trying to join ${ username }'s channel: `, err );
        } );
    } else {
      client.say( channelName, "/me Already there" )
    }
  },
  { homeOnly: true }
)
add( [ "lang", "language" ],
  ( { channels, store, client }, channelName, channelConfig, userstate, message ) => {
    const [ , targetLanguage = defaultLang ] = message.split( /\s+/ );
    if( translate.languages.isSupported( targetLanguage ) ) {
      channelConfig.lang = translate.languages.getCode( targetLanguage );
      store.put( "channels", channels );
      client.say( channelName, "/me Language was set to " + translate.languages[ channelConfig.lang ] );
    }
  },
  { modOnly: true, usage: '[language]' }
)
add( [ "languagelist", "langlist" ],
  ( { client }, channelName ) => {
    const supportedlanguages = Object.keys( translate.languages ).filter( lang => lang != "auto" && lang != "isSupported" && lang != "getCode" ).join( ", " );
    client.say( channelName, "My supported languages are: " + supportedlanguages );
  },
  { modOnly: true }
)
add( [ "languagecensor", "langcensor" ],
  ( { channels, store, client }, channelName, channelConfig ) => {
    channelConfig.uncensored = !channelConfig.uncensored;
    store.put( "channels", channels );
    client.say( channelName,
      channelConfig.uncensored
        ? "ChatTranslator will now allow NAUGHTY words."
        : "ChatTranslator will now only allow NICE words."
    );
  },
  { modOnly: true }
)
add( [ "languagestop", "langstop" ],
  ( { channels, store, client }, channelName, channelConfig ) => {
    delete channelConfig;
    store.put( "channels", channels );
    client.say( channelName, "Goodbye!!!" );
    client.part( channelName );
  },
  { modOnly: true }
)
add( [ "languagecolor", "langcolor", "languagecolour", "langcolour" ],
  ( { channels, store, client }, channelName, channelConfig ) => {
    channelConfig.color = !channelConfig.color;
    store.put( "channels", channels );
    const state = channelConfig.color ? "ENABLED" : "DISABLED"
    client.say( channelName, `Chat color was ${ state }` );
  },
  { modOnly: true }
)
add( [ "languagehelp", "langhelp" ],
  ( app, channelName, __, userstate ) => {
    let commandsList = firstKeys.sort()
      .filter( key => {
        const runner = commands[ key ]
        if( runner.modOnly && !isMod( channelName, userstate ) ) return false
        if( runner.homeOnly && !isHomeChannel( channelName, app ) ) return false
        return true
      } )
      .map( usageMapper )
      .join( ', ' )

    app.client.say( channelName, "My commands are " + commandsList );
  },
  { modOnly: true }
)

module.exports = { runCommand, commands }
