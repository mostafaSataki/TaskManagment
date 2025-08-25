import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserIdFromTokenSync } from '@/lib/auth/jwt';

// Validation schema for updating task status
const updateTaskStatusSchema = z.object({
  status: z.number().int().min(0).max(2),
});

// Helper function to check if user has access to task
async function checkTaskAccess(userId: string, taskId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      workSpace: {
        include: {
          workSpaceUsers: {
            where: {
              userId,
              isActive: true,
            },
          },
        },
      },
    },
  });

  return task && task.workSpace.workSpaceUsers.length > 0;
}

// PATCH: Update task status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Get user ID from JWT token
    const userId = getUserIdFromTokenSync(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { taskId } = await params;

    // Check if user has access to this task
    const hasAccess = await checkTaskAccess(userId, taskId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this task' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTaskStatusSchema.parse(body);

    // Update task status
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        status: validatedData.status,
        lastEditedById: userId,
        lastEditedDate: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        workSpace: {
          select: {
            id: true,
            workSpaceTitle: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });

  } catch (error) {
    console.error('Error updating task status:', error);

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