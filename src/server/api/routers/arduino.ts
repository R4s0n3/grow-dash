import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { arduinoService } from "@/server/services/arduinoService";
import type { SensorData } from "@/server/services/arduinoService";

export const arduinoRouter = createTRPCRouter({
	connect: publicProcedure
		.input(z.object({
			path: z.string().optional(),
			baudRate: z.number().optional(),
		}))
		.mutation(async ({ input, ctx }) => {
			await arduinoService.connect(input.path, input.baudRate);

			// Auto-save sensor readings to database
			arduinoService.on('sensorData', async (data: SensorData) => {
				await ctx.db.reading.create({
					data: {
						temperature: data.temp,
						humidity: data.humidity,
					}
				}).catch(console.error);
			});

			return { success: true };
		}),

	getCurrentReading: publicProcedure
		.query(() => {
			return arduinoService.getLatestReading();
		}),

	getReadings: publicProcedure
		.input(z.object({
			limit: z.number().default(50),
			since: z.date().optional(),
		}))
		.query(async ({ input, ctx }) => {
			return ctx.db.reading.findMany({
				where: input.since ? {
					createdAt: { gte: input.since }
				} : undefined,
				orderBy: { createdAt: 'desc' },
				take: input.limit,
			});
		}),

	onSensorData: publicProcedure
		.subscription(async function*() {
			const queue: SensorData[] = [];
			const waiters: Array<(value: SensorData) => void> = [];
			let isActive = true;

			const onData = (data: SensorData) => {
				if (waiters.length > 0) {
					waiters.shift()!(data);
				} else {
					queue.push(data);
				}
			};

			arduinoService.on('sensorData', onData);

			try {
				while (isActive) {
					if (queue.length > 0) {
						yield queue.shift()!;
					} else {
						yield await new Promise<SensorData>((resolve) => {
							waiters.push(resolve);
						});
					}
				}
			} finally {
				isActive = false;
				arduinoService.off('sensorData', onData);
			}
		}),
	sendCommand: publicProcedure
		.input(z.object({ command: z.string() }))
		.mutation(async ({ input }) => {
			await arduinoService.write(input.command);
			return { success: true };
		}),
	listPorts: publicProcedure
		.query(async () => {
			return arduinoService.listPorts();
		}),

	getStatus: publicProcedure
		.query(() => {
			return { connected: arduinoService.getStatus() };
		}),
});
