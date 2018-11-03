const translate = require( 'google-translate-api' );
const defaultLang = "en";

function runCommand( channel, userstate, message, app ) {
  const { client, prefixRegex, botChannelName, channels, store } = app
  const userChannel = "#" + userstate.username;
  const display = userstate[ 'display-name' ];
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
          client.say( channel, "/me Okay, " + display );
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

module.exports = { runCommand }
