const fs = require( 'fs' );
const naughtylist = fs.readFileSync( "facebook-bad-words-list_comma-separated-text-file_2018_07_29.txt", "utf8" )
  .split( ", " ).filter( Boolean );

const naughtyRegexList = naughtylist
  .map( word => new RegExp( `\\b${ word }\\b`, "gi" ) )
const CENSORED = "[censored]"

module.exports = {
  naughtyToNice,
  containsNaughtyWord
}

function naughtyToNice( text ) {
  return naughtyRegexList.reduce(
    ( string, regex ) => string.replace( regex, CENSORED ),
    text
  )
}

function containsNaughtyWord( text ) {
  for( let i = 0, len = naughtylist.length; i < len; i++ ) {
    if( text.includes( naughtylist[ i ] ) ) {
      return true;
    }
  }
  return false;
}
