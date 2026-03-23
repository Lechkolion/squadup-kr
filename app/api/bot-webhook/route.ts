import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.SQUADUP_API_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { type, data } = body;

  // Forward to the Discord bot service
  const botUrl = process.env.BOT_SERVICE_URL;
  if (botUrl) {
    try {
      await fetch(`${botUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secret}`,
        },
        body: JSON.stringify({ type, data }),
      });
    } catch {
      // Non-critical if bot is down
    }
  }

  return NextResponse.json({ ok: true });
}

// Also accept incoming webhooks from the bot → website
export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.SQUADUP_API_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  return NextResponse.json({ ok: true, received: body });
}
