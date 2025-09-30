'use client';

import { api } from "@/trpc/react";

export function SensorDashboard() {
	const { data: current } = api.arduino.getCurrentReading.useQuery(
		undefined,
		{ refetchInterval: 5000 }
	);

	const { data: history } = api.arduino.getReadings.useQuery({
		limit: 20
	});

	return (
		<div className="space-y-4">
			<div className="rounded-lg border p-4">
				<h2 className="text-xl font-bold mb-2">Current Reading</h2>
				{current ? (
					<div className="space-y-2">
						<p>Temperature: {current.temp.toFixed(1)}°C</p>
						<p>Humidity: {current.humidity.toFixed(1)}%</p>
						<p className="text-sm text-gray-500">
							{current.timestamp.toLocaleString()}
						</p>
					</div>
				) : (
					<p>No data available</p>
				)}
			</div>

			<div className="rounded-lg border p-4">
				<h2 className="text-xl font-bold mb-2">History</h2>
				<div className="space-y-2">
					{history?.map((reading) => (
						<div key={reading.id} className="text-sm">
							{reading.temperature.toFixed(1)}°C / {reading.humidity.toFixed(1)}%
							<span className="text-gray-500 ml-2">
								{new Date(reading.createdAt).toLocaleTimeString()}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
