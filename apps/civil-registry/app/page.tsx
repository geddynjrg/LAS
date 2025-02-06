import { useTranslations } from "next-intl";

import { Button } from "@workspace/ui/components/button";

const isLoing = false;

export default function Page() {
	const t = useTranslations("FrontPage");

	return (
		<div className="flex flex-1 items-center justify-center">
			<div className="flex flex-col items-center justify-center gap-4">
				<h1 className="text-2xl font-bold">civil registry app</h1>
				<p>{t("title")}</p>
				<Button size="sm">Button</Button>
				<Button size="sm" variant="danger">
					Button 2
				</Button>
				{isLoing && (
					<>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
						<p>lorem </p>
					</>
				)}
			</div>
		</div>
	);
}
