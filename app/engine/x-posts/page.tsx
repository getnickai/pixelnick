import { XPosts } from "./posts";

export const metadata = { title: "X Proposed posts — pixelnick" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account } = await searchParams;
  return <XPosts account={account ?? "getnickai"} />;
}
