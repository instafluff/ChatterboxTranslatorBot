import test from 'ava';
import { parseEmotes } from '../emotes';

test( 'parses emotes', t => {
	[
		':egg:',
		':e-mail:',
		':video_game:',
		':non-potable_water:',
		':+1:',
		':-1:',
		':clock230:',
		':100:',
		'😀',
	].forEach( v =>
		t.is( parseEmotes( {}, v ), '' )
	)
} );

test( 'title', t => {
	[
		':hello world:',
		'hello :hello world: world',
	].forEach( v =>
		t.is( parseEmotes( {}, v ), v )
	)
} );

test( 'title', t => {
	[
		[ {}, 'HENLO :egg:', 'HENLO' ],
		[ {}, 'HENLO 😀', 'HENLO' ],
		[
			{ '88': [ '0-7' ] },
			'PogChamp',
			''
		],
		[
			{ '69': [ '6-15' ] },
			'Hello BloodTrail',
			'Hello'
		],
		[
			{ '88': [ '0-7' ] },
			'PogChamp This stream',
			'This stream'
		],
		[
			{ '88': [ '0-7', '13-20' ] },
			'PogChamp WOW PogChamp',
			'WOW'
		],
		[
			{ '25': [ '0-4', '6-10', '12-16' ] },
			'Kappa Kappa Kappa',
			''
		],
		[
			{
				'25': [ '20-24' ],
				'88': [ '31-38' ],
				'58765': [ '5-15' ]
			},
			'Well NotLikeThis We Kappa Meet PogChamp Again',
			'Well We Meet Again'
		],
		[
			{
				'25': [ '12-16' ],
				'88': [ '18-25' ],
				'58765': [ '0-10' ]
			},
			'NotLikeThis Kappa PogChamp',
			''
		],
	].forEach( ( [ emoteMap, input, expected ] ) =>
		t.is( parseEmotes( emoteMap, input ), expected )
	)
} );
