import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserIdFromTokenSync } from '@/lib/auth/jwt';

// Validation schema for creating task
const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.string()).optional().default([]),
});

// Helper function to check if user has access to project
async function checkProjectAccess(userId: string, projectId: string) {
  const userProject = await db.userProject.findFirst({
    where: {
      userId,
      projectId,
    },
  });

  return userProject !== null;
}

// GET: Get tasks for a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
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

    const { projectId } = await params;

    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(userId, projectId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this project' },
        { status: 403 }
      );
    }

    // Get tasks for the project through TaskProjects
    const taskProjects = await db.taskProject.findMany({
      where: { projectId },
      include: {
        task: {
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
            project: {
              select: {
                id: true,
                title: true,
              },
            },
            userTasks: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const tasks = taskProjects.map(tp => ({
      id: tp.task.id,
      title: tp.task.title,
      description: tp.task.description,
      status: tp.task.status,
      priority: tp.task.priority,
      dueDate: tp.task.dueDate,
      createdBy: tp.task.createdBy,
      assignedTo: tp.task.assignedTo,
      project: tp.task.project,
      createdAt: tp.task.createdAt,
      updatedAt: tp.task.updatedAt,
      assignees: tp.task.userTasks.map(ut => ({
        userId: ut.user.id,
        name: ut.user.name,
        email: ut.user.email,
        status: ut.status,
        assignedAt: ut.createdAt,
      })),
    }));

    return NextResponse.json(tasks, { status: 200 });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new task in a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
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

    const { projectId } = await params;

    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(userId, projectId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this project' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);
    const { title, description, priority, dueDate, assigneeIds } = validatedData;

    // Use transaction to create task and related records
    const result = await db.$transaction(async (prisma) => {
      // Create task
      const task = await prisma.task.create({
        data: {
          title,
          description,
          priority,
          dueDate: dueDate ? new Date(dueDate) : null,
          projectId,
          createdById: userId,
          assignedToId: assigneeIds && assigneeIds.length > 0 ? assigneeIds[0] : null,
        },
      });

      // Create task-project relationship
      const taskProject = await prisma.taskProject.create({
        data: {
          taskId: task.id,
          projectId,
        },
      });

      // Create user-task relationships for assignees
      const userTasks = [];
      if (assigneeIds && assigneeIds.length > 0) {
        for (const assigneeId of assigneeIds) {
          const userTask = await prisma.userTask.create({
            data: {
              taskId: task.id,
              userId: assigneeId,
              status: 'todo',
            },
          });
          userTasks.push(userTask);
        }
      }

      return { task, taskProject, userTasks };
    });

    // Get the created task with full details
    const taskWithDetails = await db.task.findUnique({
      where: { id: result.task.id },
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
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        userTasks: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const response = {
      id: taskWithDetails!.id,
      title: taskWithDetails!.title,
      description: taskWithDetails!.description,
      status: taskWithDetails!.status,
      priority: taskWithDetails!.priority,
      dueDate: taskWithDetails!.dueDate,
      createdBy: taskWithDetails!.createdBy,
      assignedTo: taskWithDetails!.assignedTo,
      project: taskWithDetails!.project,
      createdAt: taskWithDetails!.createdAt,
      updatedAt: taskWithDetails!.updatedAt,
      assignees: taskWithDetails!.userTasks.map(ut => ({
        userId: ut.user.id,
        name: ut.user.name,
        email: ut.user.email,
        status: ut.status,
        assignedAt: ut.createdAt,
      })),
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating task:', error);

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