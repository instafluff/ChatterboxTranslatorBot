const translate = require( './languages' );
const defaultLang = "en";

const isMod = ( channelName, userstate ) => userstate.mod || "#" + userstate.username == channelName
const isHomeChannel = ( channelName, { botChannelName } ) => channelName == botChannelName

function runCommand( channel, userstate, message, app ) {
  const { prefixRegex, channels } = app
  const command = message.split( /\s/ )[ 0 ].replace( prefixRegex, '' ).toLowerCase()

  if( commands.hasOwnProperty( command ) ) {
    const commandRunner = commands[ command ]
    if( !authenticate( commandRunner, channel, userstate, app ) ) return
    commandRunner( app, channel, channels[ channel ], userstate, message )
  }
}

function authenticate( runner, channel, userstate, app ) {
  if( runner.modOnly && !isMod( channel, userstate ) ) return false
  if( runner.homeOnly && !isHomeChannel( channel, app ) ) return false
  return true
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
  {
    homeOnly: true,
    description: {
      en: 'join your channel'
    }
  }
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
  {
    modOnly: true, usage: '[language]',
    description: {
      en: 'update target language on channel'
    }
  }
)
add( [ "languagelist", "langlist" ],
  ( { client }, channelName ) => {
    const supportedlanguages = Object.keys( translate.languages ).filter( lang => lang != "auto" && lang != "isSupported" && lang != "getCode" ).join( ", " );
    client.say( channelName, "My supported languages are: " + supportedlanguages );
  },
  {
    modOnly: true,
    description: {
      en: 'list available languages'
    }
  }
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
  {
    modOnly: true,
    description: {
      en: 'toggle proffanity censoring'
    }
  }
)
add( [ "languagestop", "langstop", "languageleave", "langleave" ],
  ( { channels, store, client }, channelName, channelConfig ) => {
    delete channelConfig;
    delete channels[ channelName ];
    store.put( "channels", channels );
    client.say( channelName, "Goodbye!!!" );
    client.part( channelName );
  },
  {
    modOnly: true,
    description: {
      en: 'leave current channel'
    }
  }
)
add( [ "languagecolor", "langcolor", "languagecolour", "langcolour" ],
  ( { channels, store, client }, channelName, channelConfig ) => {
    channelConfig.color = !channelConfig.color;
    store.put( "channels", channels );
    const state = channelConfig.color ? "ENABLED" : "DISABLED"
    client.say( channelName, `Chat color was ${ state }` );
  },
  {
    modOnly: true,
    description: {
      en: 'toggle using /me'
    }
  }
)
add( [ "languagehelp", "langhelp" ],
  ( app, channelName, __, userstate, message ) => {
    const [ , command ] = message.split( /\s+/ )

    if( command && commands.hasOwnProperty( command ) ) {
      const runner = commands[ command ]

      if( authenticate( runner, channelName, userstate, app ) ) {
        app.client.say(
          channelName,
          `The command ${ command } is to ${ runner.description.en }. Usage: ${ usageMapper( command ) }`
        );
      } else {
        app.client.say(
          channelName,
          `The command ${ command } is not available to you`
        );
      }
    }
    else {
      let commandsList = firstKeys.sort()
        .filter( key => authenticate( commands[ key ], channelName, userstate, app ) )
        .map( usageMapper )
        .join( ', ' )

      app.client.say( channelName, "My commands are " + commandsList );
    }
  },
  {
    description: {
      en: 'provide help'
    }
  }
)

module.exports = { runCommand, commands }
