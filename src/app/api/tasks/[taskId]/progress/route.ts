import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Validation schema for task progress
const progressSchema = z.object({
  progress: z.number().int().min(0).max(100, 'Progress must be between 0 and 100'),
  description: z.string().optional(),
  userRole: z.number().int().min(0, 'User role is required'),
  endTime: z.string().datetime('Invalid end time format'),
});

// GET /api/tasks/[taskId]/progress - Get all progress entries for a task
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.taskId;

    // Check if task exists and user has access
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { createdById: session.user.id },
          { assignedToId: session.user.id },
          { workSpace: { workSpaceUsers: { some: { userId: session.user.id } } } }
        ]
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
    }

    const progressEntries = await db.taskProgress.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        task: {
          select: {
            id: true,
            description: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json(progressEntries);

  } catch (error) {
    console.error('Error fetching task progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[taskId]/progress - Create a new progress entry
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = params.taskId;
    const body = await request.json();

    // Validate request body
    const validatedData = progressSchema.parse(body);

    // Check if task exists and user has access
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { createdById: session.user.id },
          { assignedToId: session.user.id },
          { workSpace: { workSpaceUsers: { some: { userId: session.user.id } } } }
        ]
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
    }

    // Create the progress entry
    const progressEntry = await db.taskProgress.create({
      data: {
        taskId,
        userId: session.user.id,
        progress: validatedData.progress,
        description: validatedData.description,
        userRole: validatedData.userRole,
        endTime: new Date(validatedData.endTime),
        createdBy: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        task: {
          select: {
            id: true,
            description: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json(progressEntry, { status: 201 });

  } catch (error) {
    console.error('Error creating task progress:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}