import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { EventEmitter } from 'events';

export interface SensorData {
	temp: number;
	humidity: number;
	timestamp: Date;
}

class ArduinoService extends EventEmitter {
	private port: SerialPort | null = null;
	private parser: ReadlineParser | null = null;
	private isConnected = false;
	private latestReading: SensorData | null = null;

	async connect(path = '/dev/ttyACM0', baudRate = 9600) {
		if (this.isConnected) return;

		this.port = new SerialPort({ path, baudRate });
		this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

		this.parser.on('data', (data: string) => {
			try {
				const parsed = JSON.parse(data);
				if (parsed.temp !== undefined && parsed.humidity !== undefined) {
					const reading: SensorData = {
						temp: parsed.temp,
						humidity: parsed.humidity,
						timestamp: new Date(),
					};
					this.latestReading = reading;
					this.emit('sensorData', reading);
				}
			} catch {
				// Not JSON, emit as raw data
				this.emit('data', data.trim());
			}
		});

		this.port.on('open', () => {
			this.isConnected = true;
			this.emit('connected');
		});

		this.port.on('error', (err) => {
			this.emit('error', err);
		});
	}

	write(command: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.port?.isOpen) {
				reject(new Error('Port not open'));
				return;
			}
			this.port.write(command + '\n', (err) => {
				if (err) reject(err);
				else resolve();
			});
		});
	}

	getLatestReading() {
		return this.latestReading;
	}

	async listPorts() {
		return SerialPort.list();
	}

	disconnect() {
		this.port?.close();
		this.isConnected = false;
	}

	getStatus() {
		return this.isConnected;
	}
}

export const arduinoService = new ArduinoService();
