export interface DashboardPageProps {
  params: Promise<{}>;
}

export default async function DashboardPage({}: DashboardPageProps) {
  return <div>Dashboard page</div>;
}
