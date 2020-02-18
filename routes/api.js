const express = require('express');
const Session = require('../models/session');
const exjwt = require('express-jwt');
const asyncHandler = require('express-async-handler')
const api = express.Router();

const userAuthenticated = exjwt({ secret: process.env.SECRET_TOKEN });
const sortPattern = {'ArtsVisionFork.SessionDate': 1,'ArtsVisionFork.StartTime': 1}

/* view all route */
api.get('/api/v2/sessions', userAuthenticated, asyncHandler(async (req, res) => {
	var query = {};

	req.query.date && (query['ArtsVisionFork.SessionDate'] = req.query.date);
	req.query.location && (query['ArtsVisionFork.SessionLocation'] = req.query.location)
	req.query.type && (query['AspenCoverageFork.' + req.query.type] = true)
	req.query.status && (query['AspenChecklistFork.Status'] = req.query.status)
	
	const result = await Session.find(query).sort(sortPattern);
	
	res.json(result);
}));

api.post('/api/v2/search', userAuthenticated, asyncHandler(async (req, res) => {
	let name = req.query.q;
	const result = await Session.find({'ArtsVisionFork.SessionName': {$regex: name, $options: 'i'}})
	res.json(result);
}));

/* Individual session routes */
api.get('/api/v2/session/:id', userAuthenticated, asyncHandler(async (req, res) => {
	const result = await Session.find({'ArtsVisionFork.EventID': req.params.id},).limit(1); // No duplicates
	res.json(result);
}));

api.get('/api/v2/season/:season', userAuthenticated, asyncHandler(async (req, res) => {
	let season = decodeURI(req.params.season);
	const sessions = await Session.find({'ArtsVisionFork.SessionFest': season}).sort(sortPattern);
	res.json(sessions);
}));

/* POST Route to update Sessions */
api.post('/api/v2/session/:id/update', userAuthenticated, async (req, res) => {
	const { workflow, coverage } = req.body;
	const id = req.params.id;
	if (coverage) {
		await Session.findOneAndUpdate(
			{ 'ArtsVisionFork.EventID': id },
			{
				$set: {
					'AspenCoverageFork.Video': coverage.video,
					'AspenCoverageFork.Rover': coverage.rover,
					'AspenCoverageFork.LiveStream': coverage.livestream,
					'AspenCoverageFork.QuickClip': coverage.quickclip,
					'AspenCoverageFork.Photo': coverage.photo,
					'AspenCoverageFork.Transcript': coverage.transcript,
					'AspenCoverageFork.Audio': coverage.audio,
					'AspenCoverageFork.Quotes': coverage.quotes,
					'AspenCoverageFork.Rundown': coverage.rundown,
					'AspenCoverageFork.Restriction': coverage.restriction,
					'AspenCoverageFork.AspenNotes': coverage.notes
				}
			}
		)
			.then(() => {
				return Session.find({ 'ArtsVisionFork.EventID': id }).limit(1);
			})
			.then(session => {
				res.json(session);
			})
			.catch(err => {
				console.error(err);
			});
	} else if (workflow) {
		await Session.findOneAndUpdate(
			{ 'ArtsVisionFork.EventID': id },
			{
				$set: {
					'AspenChecklistFork.QuickClip': workflow.quickclip,
					'AspenChecklistFork.QuickClipRendered': workflow.quickclipRendered,
					'AspenChecklistFork.Recorded': workflow.recorded,
					'AspenChecklistFork.Rendered': workflow.rendered,
					'AspenChecklistFork.AlbumURL': workflow.albumURL,
					'AspenChecklistFork.YouTubeURL': workflow.youtubeURL,
					'AspenChecklistFork.SessionURL': workflow.sessionURL,
					'AspenChecklistFork.TranscriptURL': workflow.transcriptURL,
					'AspenChecklistFork.AudioURL': workflow.audioURL,
					'AspenChecklistFork.Status': workflow.status,
					'AspenChecklistFork.ReadySend': workflow.readysend,
					'AspenChecklistFork.Sent': workflow.sent,
					'AspenChecklistFork.Complete': workflow.complete
				}
			}
		)
			.then(() => {
				return Session.find({ 'ArtsVisionFork.EventID': req.params.id }).limit(1);
			})
			.then(session => {
				res.json(session);
			})
			.catch(err => {
				console.error(err);
			});
	}
});

module.exports = api;