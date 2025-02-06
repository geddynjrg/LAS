import "@workspace/ui/globals.css";

import { Providers } from "@/components/providers";
import type { ReactNode } from "react";

export interface RootLayoutProps {
	children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="antialiased">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
