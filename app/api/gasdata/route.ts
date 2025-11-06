import { NextResponse } from "next/server";

let latestData = { mq2: 0, mq7: 0, timestamp: new Date() };

export async function POST(req: Request) {
  const body = await req.json();
  latestData = { ...body, timestamp: new Date() };
  console.log("Received:", latestData);
  return NextResponse.json({ message: "Data received" });
}

export async function GET() {
  return NextResponse.json(latestData);
}
