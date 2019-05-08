import test from 'ava';
import sinon from 'sinon';
import { runCommand } from '../command';

const modUserstate = {
	username: 'joe_bloggs',
	'display-name': 'joe_bloggs',
	mod: true
}
const nonModUserstate = {
	username: 'instafluff',
	'display-name': 'instafluff',
	mod: false
}

const botChannelName = '#translator_bot_channel'
const streamerChannelName = '#instafluff'

function createMockApp() {
	const say = sinon.fake()
	const join = sinon.fake( channel => Promise.resolve( channel ) )
	const part = sinon.fake( channel => Promise.resolve( channel ) )
	const put = sinon.fake()

	return {
		client: { join, say, part },
		prefixRegex: /^\!/,
		botChannelName,
		channels: {
			[ streamerChannelName ]: {
				lang: 'en',
				color: false,
				uncensored: false
			}
		},
		store: { put },
	}
}

async function executeCommand( channel, userstate, command, application ) {
	const app = createMockApp()

	if( application ) {
		if( 'config' in application ) {
			if( application.config ) {
				Object.assign( app.channels[ streamerChannelName ], application.config )
			} else {
				app.channels[ "#instafluff" ] = application.config
			}
		}
	}

	runCommand( channel, userstate, command, app )

	await Promise.all( [
		...app.client.join.returnValues,
		...app.client.part.returnValues,
	] )

	return app
}

async function execute_command_with_no_join_leave( t, channel, userstate, command, application ) {
	const app = await executeCommand( channel, userstate, command, application )
	const { client: { join, part } } = app

	t.true( join.notCalled, 'has not joined new channel' )
	t.true( part.notCalled, 'has not left channel' )

	return app
}

/*********************************************************
 * TESTS
 *********************************************************/

test( 'JOIN: joins new channel', async t => {
	// mocking
	const {
		store: { put }, client: { say, join, part }, channels
	} = await executeCommand( botChannelName, nonModUserstate, '!join', { config: undefined } )

	t.true( say.calledTwice, 'say only called once' );
	t.true( part.notCalled, 'does not leave any channels' );
	t.true( join.calledOnce, 'joins channel' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ '#' + nonModUserstate.username ],
		{
			lang: 'en',
			color: false,
			langshow: false,
			uncensored: false
		},
		'added new channel config'
	)
	t.true(
		put.calledOnceWith(
			'channels',
			{
				[ '#' + nonModUserstate.username ]: {
					lang: 'en',
					color: false,
					langshow: false,
					uncensored: false,
				}
			}
		),
		'store needs to be notified of update'
	);
} )
test( 'JOIN: Does nothing if already connected', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, botChannelName, nonModUserstate, '!join' )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: false
		},
		'channels should not have been mutated'
	)
	t.true( put.notCalled, 'store update not called' );
} )
test( 'JOIN: Does nothing if in away channel', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!join' )

	t.true( say.notCalled, 'say only not called' );
	t.true( put.notCalled, 'store update not called' );
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: false
		},
		'channels should not have been mutated'
	)
} )

test( 'SET LANGUAGE: lang', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!lang fr' )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'fr',
			color: false,
			uncensored: false
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )
test( 'SET LANGUAGE: language', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!language fr' )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'fr',
			color: false,
			uncensored: false
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )
test( 'SET LANGUAGE: Does not fail when no language param is provided, defaulting to English', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!language', { lang: 'cy' } )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: false
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )

test( 'LIST: languagelist', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, botChannelName, modUserstate, '!languagelist' )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: false
		},
		'channels should not have been mutated'
	)
	t.true( put.notCalled, 'store update not called' );
} )
test( 'LIST: langlist', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, botChannelName, modUserstate, '!langlist' )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: false
		},
		'channels should not have been mutated'
	)
	t.true( put.notCalled, 'store update not called' );
} )

test( 'CENSOR: languagecensor', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!languagecensor' )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: true
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )
test( 'CENSOR: languagecensor - from true', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!languagecensor', { config: { uncensored: true } } )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: false
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )
test( 'CENSOR: langcensor', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!langcensor' )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: true
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )
test( 'CENSOR: langcensor - from true', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!langcensor', { config: { uncensored: true } } )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: false
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )

test( 'LEAVE: languagestop', async t => {
	const {
		store: { put }, client: { say, join, part }, channels
	} = await executeCommand( botChannelName, modUserstate, '!languagestop' )

	t.true( part.calledOnce, 'leaves channel' );
	t.true( join.notCalled, 'does not join a channel' );
	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.is( channels[ botChannelName ], undefined, 'channel config should be removed' )
	t.true( put.called, 'store update called' );
} )
test( 'LEAVE: langstop', async t => {
	const {
		store: { put }, client: { say, join, part }, channels
	} = await executeCommand( botChannelName, modUserstate, '!langstop' )

	t.true( part.calledOnce, 'leaves channel' );
	t.true( join.notCalled, 'leaves channel' );
	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.is( channels[ botChannelName ], undefined, 'channel config should be removed' )
	t.true( put.called, 'store update called' );
} )

test( 'COLOUR: languagecolor', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!languagecolor' )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: true,
			uncensored: false
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )
test( 'COLOUR: languagecolor - from true', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!languagecolor', { config: { color: true } } )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: false
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )
test( 'COLOUR: langcolor', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!langcolor' )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: true,
			uncensored: false
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )
test( 'COLOUR: langcolor - from true', async t => {
	const {
		store: { put }, client: { say, }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!langcolor', { config: { color: true } } )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: false
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )
test( 'COLOUR: languagecolour', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!languagecolour' )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: true,
			uncensored: false
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )
test( 'COLOUR: languagecolour - from true', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!languagecolour', { config: { color: true } } )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: false
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )
test( 'COLOUR: langcolour', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!langcolour' )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: true,
			uncensored: false
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )
test( 'COLOUR: langcolour - from true', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, streamerChannelName, modUserstate, '!langcolour', { config: { color: true } } )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: false
		},
		'channel config should be mutated'
	)
	t.true( put.called, 'store update called' );
} )

test( 'HELP: languagehelp', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, botChannelName, modUserstate, '!languagehelp' )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: false
		},
		'channels should not have been mutated'
	)
	t.true( put.notCalled, 'store update not called' );
} )
test( 'HELP: langhelp', async t => {
	const {
		store: { put }, client: { say }, channels
	} = await execute_command_with_no_join_leave( t, botChannelName, modUserstate, '!langhelp' )

	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ streamerChannelName ],
		{
			lang: 'en',
			color: false,
			uncensored: false
		},
		'channels should not have been mutated'
	)
	t.true( put.notCalled, 'store update not called' );
} )

test( 'ignores non-mods', async t => {
	const app = createMockApp()
	const { store: { put }, client: { say, join, part } } = app

	runCommand( botChannelName, nonModUserstate, '!lang en', app )
	runCommand( botChannelName, nonModUserstate, '!lang fr', app )
	runCommand( botChannelName, nonModUserstate, '!lang', app )
	runCommand( botChannelName, nonModUserstate, '!language gr', app )
	runCommand( botChannelName, nonModUserstate, '!language pl', app )
	runCommand( botChannelName, nonModUserstate, '!language', app )
	runCommand( botChannelName, nonModUserstate, '!languagelist', app )
	runCommand( botChannelName, nonModUserstate, '!langlist', app )
	runCommand( botChannelName, nonModUserstate, '!languagecensor', app )
	runCommand( botChannelName, nonModUserstate, '!langcensor', app )
	runCommand( botChannelName, nonModUserstate, '!languagestop', app )
	runCommand( botChannelName, nonModUserstate, '!langstop', app )
	runCommand( botChannelName, nonModUserstate, '!languagecolor', app )
	runCommand( botChannelName, nonModUserstate, '!langcolor', app )

	runCommand( botChannelName, nonModUserstate, '!help', app )
	runCommand( botChannelName, nonModUserstate, '!junk', app )
	runCommand( botChannelName, nonModUserstate, '!hello', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	t.true( say.notCalled, 'say only not called' );
	t.true( put.notCalled, 'store update not called' );
} )
