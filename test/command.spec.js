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

/*********************************************************
 * TESTS
 *********************************************************/

test( 'JOIN: joins new channel', async t => {
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app
	channels[ streamerChannelName ] = undefined

	// execution
	runCommand( botChannelName, nonModUserstate, '!join', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
	t.true( say.calledTwice, 'say only called once' );
	t.true( join.calledOnce, 'joins channel' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.deepEqual(
		channels[ '#' + nonModUserstate.username ],
		{
			lang: 'en',
			color: false,
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
					uncensored: false,
				}
			}
		),
		'store needs to be notified of update'
	);
} )
test( 'JOIN: Does nothing if already connected', async t => {
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( botChannelName, nonModUserstate, '!join', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( streamerChannelName, modUserstate, '!join', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( streamerChannelName, modUserstate, '!lang fr', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( streamerChannelName, modUserstate, '!language fr', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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

test( 'LIST: languagelist', async t => {
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( botChannelName, modUserstate, '!languagelist', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( botChannelName, modUserstate, '!langlist', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( streamerChannelName, modUserstate, '!languagecensor', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app
	channels[ streamerChannelName ].uncensored = true

	// execution
	runCommand( streamerChannelName, modUserstate, '!languagecensor', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( streamerChannelName, modUserstate, '!langcensor', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app
	channels[ streamerChannelName ].uncensored = true

	// execution
	runCommand( streamerChannelName, modUserstate, '!langcensor', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( botChannelName, modUserstate, '!languagestop', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
	t.true( part.calledOnce, 'leaves channel' );
	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.is( channels[ botChannelName ], undefined, 'channel config should be removed' )
	t.true( put.called, 'store update called' );
} )
test( 'LEAVE: langstop', async t => {
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( botChannelName, modUserstate, '!langstop', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
	t.true( part.calledOnce, 'leaves channel' );
	t.true( say.calledOnce, 'say only called once' );
	t.snapshot( say.args, 'Feedback to the user' )
	t.is( channels[ botChannelName ], undefined, 'channel config should be removed' )
	t.true( put.called, 'store update called' );
} )

test( 'COLOUR: languagecolor', async t => {
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( streamerChannelName, modUserstate, '!languagecolor', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app
	channels[ streamerChannelName ].color = true

	// execution
	runCommand( streamerChannelName, modUserstate, '!languagecolor', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( streamerChannelName, modUserstate, '!langcolor', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app
	channels[ streamerChannelName ].color = true

	// execution
	runCommand( streamerChannelName, modUserstate, '!langcolor', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( streamerChannelName, modUserstate, '!languagecolour', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app
	channels[ streamerChannelName ].color = true

	// execution
	runCommand( streamerChannelName, modUserstate, '!languagecolour', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( streamerChannelName, modUserstate, '!langcolour', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app
	channels[ streamerChannelName ].color = true

	// execution
	runCommand( streamerChannelName, modUserstate, '!langcolour', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( botChannelName, modUserstate, '!languagehelp', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part }, channels } = app

	// execution
	runCommand( botChannelName, modUserstate, '!langhelp', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
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
	// mocking
	const app = createMockApp()
	const { store: { put }, client: { say, join, part } } = app

	// execution
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
	runCommand( botChannelName, nonModUserstate, '!languagehelp', app )
	runCommand( botChannelName, nonModUserstate, '!langhelp', app )

	runCommand( botChannelName, nonModUserstate, '!help', app )
	runCommand( botChannelName, nonModUserstate, '!junk', app )
	runCommand( botChannelName, nonModUserstate, '!hello', app )

	await Promise.all( [
		...join.returnValues,
		...part.returnValues,
	] )

	// assertion
	t.true( say.notCalled, 'say only not called' );
	t.true( put.notCalled, 'store update not called' );
} )
