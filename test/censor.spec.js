import test from 'ava';
import { naughtyToNice } from '../censor';

test( 'cencors unwanted words', t => {
	t.is(
		naughtyToNice( 'The Welsh love to eat faggot and gravy' ),
		'The Welsh love to eat [censored] and gravy'
	);
	t.is(
		naughtyToNice( 'In the 60\'s: They had a gay old time' ),
		'In the 60\'s: They had a [censored] old time'
	);
	t.is(
		naughtyToNice( 'The netherlands have many dykes; A dyke helps prevent flooding' ),
		'The netherlands have many [censored]; A [censored] helps prevent flooding'
	);
	t.is(
		naughtyToNice( 'The Blue-Footed Boobies are a bird of the genus Sula – known as boobies' ),
		'The Blue-Footed [censored] are a bird of the genus Sula – known as [censored]'
	);
	t.is(
		naughtyToNice( '"Yobbo" is an insut for a person who acts in a loud and impolite manner' ),
		'"[censored]" is an insut for a person who acts in a loud and impolite manner'
	);
} );

test( 'does not censor acceptible strings', t => {
	t.is(
		naughtyToNice( 'The Summer is Warm; The winter is cold' ),
		'The Summer is Warm; The winter is cold'
	);
	t.is(
		naughtyToNice( 'It costs nothing to be nice' ),
		'It costs nothing to be nice'
	);
	t.is(
		naughtyToNice( 'You call than a knife? This is a knife!' ),
		'You call than a knife? This is a knife!'
	);
} );

test( 'does not censor ambiguos strings', t => {
	[ // These are British places
		'Scunthorpe',
		'Battledykes',
		'Cockfosters',
		'Shitterton',
		'Upper Dicker',
	].forEach(
		word => t.is( naughtyToNice( word ), word )
	)
} );
