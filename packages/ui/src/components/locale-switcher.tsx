"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, LanguagesIcon } from "lucide-react";
import { useTransition } from "react";

import { Select } from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";

type LocaleSwitcherProps<T extends string> = {
	defaultValue: T;
	items: readonly { value: T; label: string }[];
	onChange: (value: T) => Promise<void>;
};

export const LocaleSwitcher = <T extends string>({
	defaultValue,
	items,
	onChange,
}: LocaleSwitcherProps<T>) => {
	const [isPending, startTransition] = useTransition();

	function handleChange(value: T) {
		const locale = value as T;
		startTransition(() => {
			onChange(locale);
		});
	}

	return (
		<Select
			defaultValue={defaultValue}
			onValueChange={handleChange}
			options={items}
		/>
	);

	return (
		<div className="relative">
			<SelectPrimitive.Root
				defaultValue={defaultValue}
				onValueChange={handleChange}
			>
				<SelectPrimitive.Trigger
					className={cn(
						"rounded-sm p-2 transition-colors hover:bg-slate-200",
						isPending && "pointer-events-none opacity-60",
					)}
				>
					<SelectPrimitive.Icon>
						<LanguagesIcon className="h-6 w-6 text-slate-600 transition-colors group-hover:text-slate-900" />
					</SelectPrimitive.Icon>
				</SelectPrimitive.Trigger>
				<SelectPrimitive.Portal>
					<SelectPrimitive.Content
						align="end"
						className="min-w-[8rem] overflow-hidden rounded-sm bg-white py-1 shadow-md"
						position="popper"
					>
						<SelectPrimitive.Viewport>
							{items.map((item) => (
								<SelectPrimitive.Item
									key={item.value}
									className="flex cursor-default items-center px-3 py-2 text-base data-[highlighted]:bg-slate-100"
									value={item.value}
								>
									<div className="mr-2 w-[1rem]">
										{item.value === defaultValue && (
											<CheckIcon className="h-5 w-5 text-slate-600" />
										)}
									</div>
									<span className="text-slate-900">
										{item.label}
									</span>
								</SelectPrimitive.Item>
							))}
						</SelectPrimitive.Viewport>
						<SelectPrimitive.Arrow className="fill-white text-white" />
					</SelectPrimitive.Content>
				</SelectPrimitive.Portal>
			</SelectPrimitive.Root>
		</div>
	);
};
