import { SerialPort } from "serialport";

const PORT_PATH = process.env.SERIAL_PORT || "/dev/ttyUSB0";
const BAUD_RATE = 9600;

const port = new SerialPort({
	path: PORT_PATH,
	baudRate: BAUD_RATE
});

port.on("open", () => {
	return "Serial port to Arduino opened";
});

port.on("data", async (data: Buffer) => {
	const message = data.toString().trim();
	console.log("Received:", message);

	// Assume format: "TEMP:25.5,HUM:60.0"
	if (message.startsWith("TEMP:")) {
		try {
			const parts = message.split(",");
			if (parts.length < 2) return;

			const tempParts = parts[0]?.split(":");
			const humParts = parts[1]?.split(":");
			if (!tempParts || !humParts) return;
			const tempStr = tempParts[1];
			const humStr = humParts[1];

			if (!tempStr || !humStr) return;

			const temperature = Math.round(parseFloat(tempStr) * 10); // Store as int, e.g., 255 for 25.5
			const humidity = Math.round(parseFloat(humStr) * 10);

			console.log(
				`Saved reading: Temp ${temperature / 10}°C, Hum ${humidity}%`,
			);

			return { temperature, humidity }
		} catch (error: unknown) {
			console.error("Error parsing or saving data:", error);
		}
	}
});

port.on("error", (err: Error) => {
	console.error("Serial port error:", err.message);
});

export { port };
