'use strict';

var SerializerFactory = require('./serializer/serializerFactory'),
	util = require('util'),
	fs = require('fs');


// Abstract Base class for each link in the chain - Chain of Responsibility Pattern
var Link = function (next) {
	this._next = next;
};

Link.prototype = {

	_canHandle: function (source) {
		return false;
	},

	_doExecute: function(source, sourceType, callback) {
		callback(new Error('not implemented'));
	},

	execute: function (source, sourceType, callback) {
		if (this._canHandle(source)) {
			this._doExecute(source, sourceType, callback);
		} else if (this._next) {
			this._next.execute(source, sourceType, callback);
		} else {
			throw new Error('Unrecognized input format.');
		}
	}

};




var BufferSource = function () {
	BufferSource.super_.apply(this, arguments);
};

util.inherits(BufferSource, Link);

BufferSource.prototype._canHandle = function (source) {
	return Buffer.isBuffer(source);
};

BufferSource.prototype._doExecute = function (source, sourceType, callback) {
	var deserializer = SerializerFactory.buildDeserializer(sourceType);
	deserializer.write(source);
	deserializer.end();
	deserializer.deserialize(callback);
};




var StreamSource = function () {
	StreamSource.super_.apply(this, arguments);
};

util.inherits(StreamSource, Link);

StreamSource.prototype._canHandle = function (source) {
	return source instanceof StreamSource;
};

StreamSource.prototype._doExecute = function (source, sourceType, callback) {
	var deserializer = SerializerFactory.buildDeserializer(sourceType);
	util.pump(source, deserializer, function (err) {
		if (err) {
			callback(err);
			return;
		}
		deserializer.deserialize(callback);
	}.bind(this));
};




var FileSource = function () {
	FileSource.super_.apply(this, arguments);
};

util.inherits(FileSource, StreamSource);

FileSource.prototype._canHandle = function (source) {
	return typeof source === 'string';
};

FileSource.prototype._doExecute = function (source, sourceType, callback) {
	FileSource.super_.prototype._doExecute.apply(this, [fs.createReadStream(source), sourceType, callback]);
};



// Build chain
/*global exports:true*/
exports = module.exports = new BufferSource(new StreamSource(new FileSource()));
/*global exports:false*/