module.exports = {
  parseEmotes,
}

const whitespaceRegex = /\s+/g
const doubleColonRegex = /:(\w|-|\+)+:/g
const emoteRegexMap = new Map()

function parseEmotes( emotes, message ) {
  let parsed = message;

  for( var emoteID in emotes ) {
    if( !emotes.hasOwnProperty( emoteID ) ) return

    let regex = emoteRegexMap.get( emoteID )

    if( !regex ) {
      const [ start, end ] = emotes[ emoteID ][ 0 ].split( '-' );
      regex = new RegExp( `\\b${ message.substring( Number( start ), Number( end ) + 1 ) }\\b`, 'g' );
      emoteRegexMap.set( emoteID, regex )
    }

    parsed = parsed.replace( regex, '' );
  }

  parsed = parsed.replace( doubleColonRegex, '' )
  parsed = parsed.trim().replace( whitespaceRegex, ' ' );
  return parsed
}
