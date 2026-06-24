import { XPerformance } from "./performance";

export const metadata = { title: "X Performance — pixelnick" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; sort?: string }>;
}) {
  const { account, sort } = await searchParams;
  return (
    <XPerformance
      account={account ?? "getnickai"}
      sort={sort === "reach" ? "reach" : "virality"}
    />
  );
}
