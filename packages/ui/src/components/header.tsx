import type { FC, ReactNode } from "react";

export interface HeaderProps {
	startDecorator?: ReactNode;
	endDecorator?: ReactNode;
	children?: ReactNode;
}

export const Header: FC<HeaderProps> = ({
	startDecorator,
	endDecorator,
	children,
}) => {
	return (
		<>
			<header className="bg-header text-header-foreground h-(--header-height) sticky top-0 z-10 flex w-full items-center px-4 shadow-md">
				<div className="h-[80%] [&>*]:h-full">{startDecorator}</div>

				<div className="flex flex-1 flex-row items-center justify-center">
					{children}
					{/* <Button
					className="justify-self-end"
					variant="ghost"
					onClick={toggleSidebar}
				>
					<SidebarIcon />
				</Button> */}
				</div>

				<div className="flex flex-row items-center justify-center">
					{endDecorator}
					{/* <SearchForm className="w-full sm:ml-auto sm:w-auto" /> */}
				</div>

				{/* <Separator orientation="vertical" className="mr-2 h-4" /> */}
				{/* <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">
                Building Your Application
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Data Fetching</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb> */}

				{/* <SearchForm className="w-full sm:ml-auto sm:w-auto" /> */}
			</header>
		</>
	);
};
