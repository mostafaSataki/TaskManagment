import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getToken } from '@/lib/auth';

// Schema for comment validation
const commentSchema = z.object({
  body: z.string().min(1, 'Comment body is required'),
});

// GET handler for retrieving task comments
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // Get user ID from JWT token
    const token = await getToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.sub;
    const taskId = params.taskId;

    // Check if task exists and user has access to it
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            userProjects: {
              where: { userId: userId }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user has access to the project
    if (task.project.userProjects.length === 0) {
      return NextResponse.json({ error: 'Access denied to this task' }, { status: 403 });
    }

    // Get all comments for the task with user information
    const comments = await db.comment.findMany({
      where: { taskId: taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for creating new comments
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // Get user ID from JWT token
    const token = await getToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = token.sub;
    const taskId = params.taskId;

    // Check if task exists and user has access to it
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            userProjects: {
              where: { userId: userId }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user has access to the project
    if (task.project.userProjects.length === 0) {
      return NextResponse.json({ error: 'Access denied to this task' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = commentSchema.parse(body);

    // Create new comment
    const comment = await db.comment.create({
      data: {
        taskId: taskId,
        userId: userId,
        body: validatedData.body,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}