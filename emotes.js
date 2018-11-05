const emoji = require( 'emoji-regex' );

module.exports = {
  parseEmotes,
}

const whitespaceRegex = module.exports.whitespaceRegex = /\s+/g
const doubleColonRegex = /:(\w|-|\+)+:/g
const emoteRegexMap = new Map()
const delim = '[EMOTE-ERROR] '
const errorMapper = ln => delim + ln

function parseEmotes( emotes, message ) {
  let parsed = message;

  for( var emoteID in emotes ) {
    let emoteText
    try {
      if( !emotes.hasOwnProperty( emoteID ) ) return

      let regex = emoteRegexMap.get( emoteID )

      if( !regex ) {
        const [ start, end ] = emotes[ emoteID ][ 0 ].split( '-' );
        emoteText = message.substring( Number( start ), Number( end ) + 1 )
        regex = new RegExp( `\\b${ emoteText }\\b`, 'g' );
        emoteRegexMap.set( emoteID, regex )
      }

      parsed = parsed.replace( regex, '' );
    } catch( e ) {
      e.message = e.message.split( '/n' ).map( errorMapper ).join( '\n' )
      console.log(
        `${ delim }An error occured when parsing for emotes in: ${ emoteID } -> ${ emotes }\n`,
        `${ delim }Message: ${ message }\n`,
        e
      );
    }
  }

  parsed = parsed.replace( doubleColonRegex, '' )
  parsed = parsed.replace( emoji, '' )
  parsed = parsed.trim().replace( whitespaceRegex, ' ' );
  return parsed
}
