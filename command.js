const translate = require( 'google-translate-api' );
const defaultLang = "en";

function runCommand( channel, userstate, message, app ) {
  const { client, prefixRegex, botChannelName, channels, store } = app
  const { username } = userstate
  const command = message.replace( prefixRegex, '' ).toLowerCase()
  const userChannel = "#" + userstate.username;

  // Join request in home channel
  if( channel == botChannelName ) {
    switch( command ) {
      case "join":
        if( !channels[ userChannel ] ) {
          client.join( userChannel )
            .then( ( data ) => {
              channels[ data ] = {
                lang: defaultLang,
                color: false,
                uncensored: false
              };
              store.put( "channels", channels );
              client.say( userChannel, "/me Hello! I am ready to translate" );
              client.say( channel, "/me Okay, " + userstate[ 'display-name' ] );
            } )
            .catch( e => {
              client.say( channel, `@${ userstate.username } Something went wrong` );
              console.log( `Something went wrong when trying to join ${ username }'s channel: `, err );
            } );
        } else {
          client.say( channel, "/me Already there" )
        }
        return;
    }
  }

  const isBroadcaster = userChannel == channel;
  const isMod = userstate.mod;
  const channelConfig = channels[ channel ]

  // Bot managment
  if( isBroadcaster || isMod ) {
    if( message.startsWith( "!lang " ) || message.startsWith( "!language " ) ) {
      const targetLanguage = message.split( " " )[ 1 ].trim();
      if( translate.languages.isSupported( targetLanguage ) ) {
        channelConfig.lang = translate.languages.getCode( targetLanguage );
        store.put( "channels", channels );
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
      case "languagecolour":
      case "langcolour":
        channelConfig.color = !channelConfig.color;
        store.put( "channels", channels );
        const state = channelConfig.color ? "ENABLED" : "DISABLED"
        return client.say( channel, `Chat color was ${ state }` );
      case "languagehelp":
      case "langhelp":
        return client.say( channel, "My commands are !lang [language], !langlist, !langcolor, !langstop" );
    }
  }
}

module.exports = { runCommand }
