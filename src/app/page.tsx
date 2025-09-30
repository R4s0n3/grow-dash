import Link from "next/link";

import { HydrateClient, api } from "@/trpc/server";
import { SensorDashboard } from "./_components/sensor-dashboard";

export default async function Home() {


	return (
		<HydrateClient>
			<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-black to-[#121422] text-white">
				<SensorDashboard />
			</main>
		</HydrateClient>
	);
}
