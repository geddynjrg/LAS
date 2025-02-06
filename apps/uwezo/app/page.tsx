import { Button } from "@workspace/ui/components/button";

export default function Page() {
	return (
		<div className="flex flex-1 items-center justify-center">
			<div className="flex flex-col items-center justify-center gap-4">
				<h1 className="text-2xl font-bold">Uwezo app</h1>
				<Button size="sm">Button</Button>
				<Button size="sm" variant="danger">
					Button 2
				</Button>
			</div>
		</div>
	);
}
