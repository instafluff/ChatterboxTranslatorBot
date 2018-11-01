const fs = require( 'fs' );
const naughtylist = fs.readFileSync( "facebook-bad-words-list_comma-separated-text-file_2018_07_29.txt", "utf8" ).split( ", " );

module.exports = {
  naughtyToNice,
  containsNaughtyWord
}

const CENSORED = "[censored]"

function naughtyToNice( text ) {
  let niceText = text;
  for( var i = 0; i < naughtylist.length; i++ ) {

    const badword = naughtylist[ i ];
    if( text.includes( badword ) ) {
      if( badword.includes( " " ) ) {
        const regex = new RegExp( naughtylist[ i ], "g" );
        niceText = niceText.replace( regex, CENSORED );
      }
      else {
        let parts = niceText.split( " " );
        let newText = [];
        for( var j = 0; j < parts.length; j++ ) {
          if( parts[ j ] == badword ) {
            newText.push( CENSORED )
          }
          else {
            newText.push( parts[ j ] );
          }
        }
        niceText = newText.join( " " );
      }
    }
  }
  return niceText;
}

function containsNaughtyWord( text ) {
  for( let i = 0, len = naughtylist.length; i < len; i++ ) {
    if( text.includes( naughtylist[ i ] ) ) {
      return true;
    }
  }
  return false;
}
