import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/mongodb';

// ✅ CREATE - POST method
export async function POST(req: NextRequest) {
  try {
    const { elementData } = await req.json();

    if (!elementData || !elementData.id) {
      return NextResponse.json(
        { message: 'Element data with ID required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const document = {
      elementId: elementData.id,
      elementData: elementData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('timeline').insertOne(document);

    return NextResponse.json({
      success: true,
      elementId: elementData.id,
      _id: result.insertedId
    });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { message: 'Failed to create element' },
      { status: 500 }
    );
  }
}

// ✅ READ - GET method
export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const elements = await db.collection('timeline')
      .find({})
      .sort({ 'elementData.timeFrame.start': 1 })
      .toArray();

    return NextResponse.json({ elements });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch elements' },
      { status: 500 }
    );
  }
}

// ✅ UPDATE - PUT method (THIS FIXES THE 405 ERROR)
export async function PUT(req: NextRequest) {
  try {
    const { elementId, elementData } = await req.json();

    if (!elementId || !elementData) {
      return NextResponse.json(
        { message: 'Element ID and data required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const result = await db.collection('timeline').updateOne(
      { elementId: elementId },
      {
        $set: {
          elementData: elementData,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: 'Element not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      modified: result.modifiedCount
    });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { message: 'Failed to update element' },
      { status: 500 }
    );
  }
}

// ✅ DELETE - DELETE method
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const elementId = searchParams.get('elementId');
    console.log('✌️elementId --->', elementId);

    if (!elementId) {
      return NextResponse.json(
        { message: 'Element ID required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const result = await db.collection('timeline').deleteOne({
      elementId: elementId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: 'Element not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { message: 'Failed to delete element' },
      { status: 500 }
    );
  }
}