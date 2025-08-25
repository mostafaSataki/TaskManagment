import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Validation schema for task requirements
const requirementSchema = z.object({
  body: z.string().min(1, 'Requirement body is required'),
  order: z.number().int().min(0, 'Order must be a positive integer').optional(),
  isDone: z.boolean().default(false),
});

// GET /api/tasks/[taskId]/requirements - Get all requirements for a task
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

    const requirements = await db.taskRequirement.findMany({
      where: { taskId },
      orderBy: { order: 'asc' },
      include: {
        task: {
          select: {
            id: true,
            description: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json(requirements);

  } catch (error) {
    console.error('Error fetching task requirements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[taskId]/requirements - Create a new requirement
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
    const validatedData = requirementSchema.parse(body);

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

    // Get the highest order for existing requirements
    const maxOrder = await db.taskRequirement.findFirst({
      where: { taskId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const newOrder = validatedData.order ?? (maxOrder ? maxOrder.order + 1 : 0);

    // Create the requirement
    const requirement = await db.taskRequirement.create({
      data: {
        taskId,
        body: validatedData.body,
        order: newOrder,
        isDone: validatedData.isDone,
        createdBy: session.user.id
      },
      include: {
        task: {
          select: {
            id: true,
            description: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json(requirement, { status: 201 });

  } catch (error) {
    console.error('Error creating task requirement:', error);

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