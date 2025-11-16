import { NextResponse } from 'next/server';

type RouteParams = {
  params: Promise<{
    podId: string;
  }>;
};

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const apiKey = process.env.RUNPOD_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'RunPod API key not configured' },
        { status: 400 }
      );
    }

    const { podId } = await params;

    if (!podId) {
      return NextResponse.json(
        { error: 'Pod ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://rest.runpod.io/v1/pods/${podId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to delete pod', details: errorText },
        { status: response.status }
      );
    }
    //there is no json response on delete just a 204 no content
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete RunPod pod:', error);
    return NextResponse.json(
      { error: 'Failed to delete RunPod pod' },
      { status: 500 }
    );
  }
}
