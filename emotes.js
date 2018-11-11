const emoji = require( 'emoji-regex' )();

module.exports = {
  parseEmotes,
}

const whitespaceRegex = module.exports.whitespaceRegex = /\s+/g
const doubleColonRegex = /:(\w|-|\+)+:/g

// regex creation
const emoteRegexMap = new Map()
const regexChar = /\[|\\|\^|\$|\.|\||\?|\*|\+|\(|\)/g
const escapeChar = char => '\\' + char
const startBound = '(^|\\b|\\s)'
const endBound = '($|\\b|\\s)'

function parseEmotes( emotes, message ) {
  let parsed = message;

  for( var emoteID in emotes ) {
    if( !emotes.hasOwnProperty( emoteID ) ) return

    let regex = emoteRegexMap.get( emoteID )

    if( !regex ) {
      let [ start, end ] = emotes[ emoteID ][ 0 ]
        .split( '-' )
        .map( Number );
      end++

      if( start === 0 && end === message.length ) {
        return ''
      }

      let emoteText = message.substring( start, end )
        .replace( regexChar, escapeChar )

      try {
        regex = new RegExp( startBound + emoteText + endBound, 'g' );
      } catch( e ) {
        console.log( 'Exception on emote: ', emoteText, ': ', e );
        /**
         * If there was an exception, don't try to use an non-existant regex
         */
        continue;
      }

      emoteRegexMap.set( emoteID, regex )
    }

    /*
     * Because the regexes match against bounding whitespace,
     * a whitespace character needs to be inserted
     * to prevent words from being falsely concatenated.
     * But will be tidied up before returning.
     */
    parsed = parsed.replace( regex, ' ' );
  }

  parsed = parsed
    .replace( doubleColonRegex, '' )
    .replace( emoji, '' )
    .replace( whitespaceRegex, ' ' )
    .trim();
  return parsed
}
