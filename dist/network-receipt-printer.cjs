'use strict';

var net = require('node:net');

class EventEmitter {
    constructor(device) {
        this._events = {};
    }

    on(e, f) {
        this._events[e] = this._events[e] || [];
        this._events[e].push(f);
    }

    emit(e, ...args) {
        let fs = this._events[e];
        if (fs) {
            fs.forEach(f => {
                setTimeout(() => f(...args), 0);
            });
        }
    }        
}

class ReceiptPrinterDriver {}

class NetworkReceiptPrinter extends ReceiptPrinterDriver {

	#emitter;
	#client;
	
	#options = {};

	constructor(options) {
		super();

		this.#emitter = new EventEmitter();
		this.#client = new net.Socket();

        this.#options = {
			host:		options.host || 'localhost',
			port:		options.port || 9100,
			timeout:	options.timeout || 2500,
        };
	}

	async connect() {
		this.#client.setTimeout(this.#options.timeout);

		this.#client.connect(this.#options.port, this.#options.host, () => {
			this.#emitter.emit('connected', {
				type: 'network'
			});
		});

		this.#client.on('timeout', () => {
			this.#client.destroy();
			this.#emitter.emit('timeout');
		});

		this.#client.on('error', (e) => {
			this.#client.destroy();
			this.#emitter.emit('error', e);
		});

		this.#client.on('close', () => {
			this.#emitter.emit('disconnected');
		});
	}

	async listen() {
		this.#client.on('data', data => {
			this.#emitter.emit('data', data);
		});

		return true;
	}

	async disconnect() {
		this.#client.destroy();
	}
	
	async print(command) {
		let CHUNK_SIZE = 1024;
		let offset = 0;

		while (offset < command.length) {
			const chunk = command.slice(offset, offset + CHUNK_SIZE);
			
			await new Promise(resolve => {
				this.#client.write(chunk, null, resolve);
			});
			
			offset += CHUNK_SIZE;
		}
	}

	addEventListener(n, f) {
		this.#emitter.on(n, f);
	}
}

module.exports = NetworkReceiptPrinter;
