import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.RUNPOD_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'RunPod API key not configured' },
        { status: 400 }
      );
    }

    const response = await fetch('https://rest.runpod.io/v1/pods?includeMachine=true', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch pods', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch RunPod pods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RunPod pods' },
      { status: 500 }
    );
  }
}
