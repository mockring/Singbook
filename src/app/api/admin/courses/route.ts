import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Courses fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, sessions, description, image, isActive } = body;

    if (!name || !price || !sessions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        name,
        price: parseInt(price),
        sessions: parseInt(sessions),
        description,
        image,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error('Course create error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, price, sessions, description, image, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (price) updateData.price = parseInt(price);
    if (sessions) updateData.sessions = parseInt(sessions);
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (isActive !== undefined) updateData.isActive = isActive;

    const course = await prisma.course.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error('Course update error:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    await prisma.course.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Course delete error:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
