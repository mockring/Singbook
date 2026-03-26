import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(locations);
  } catch (error) {
    console.error('Locations fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, address, price, description, image, isActive } = body;

    if (!name || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const location = await prisma.location.create({
      data: {
        name,
        address,
        price: price || 0,
        description,
        image,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error('Location create error:', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, address, price, description, image, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Location ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (price !== undefined) updateData.price = parseInt(price);
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (isActive !== undefined) updateData.isActive = isActive;

    const location = await prisma.location.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error('Location update error:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Location ID required' }, { status: 400 });
    }

    await prisma.location.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Location delete error:', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}
