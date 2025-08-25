import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserIdFromTokenSync } from '@/lib/auth/jwt';

// Validation schema for creating task
const createTaskSchema = z.object({
  description: z.string().min(1, 'Task description is required'),
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
  timeEstimateDay: z.number().int().min(0).optional(),
  timeEstimateHour: z.number().int().min(0).max(23).optional(),
  timeEstimateMinute: z.number().int().min(0).max(59).optional(),
  priority: z.number().int().min(0).optional(),
  importanceType: z.number().int().min(0).optional(),
  assignedToId: z.string().optional(),
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
            workSpace: {
              select: {
                id: true,
                workSpaceTitle: true,
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
            taskRequirements: {
              orderBy: { order: 'asc' },
            },
            taskProgresses: {
              orderBy: { createdAt: 'desc' },
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
      description: tp.task.description,
      status: tp.task.status,
      priority: tp.task.priority,
      importanceType: tp.task.importanceType,
      startDateTime: tp.task.startDateTime,
      endDateTime: tp.task.endDateTime,
      timeEstimateDay: tp.task.timeEstimateDay,
      timeEstimateHour: tp.task.timeEstimateHour,
      timeEstimateMinute: tp.task.timeEstimateMinute,
      createdBy: tp.task.createdBy,
      assignedTo: tp.task.assignedTo,
      workSpace: tp.task.workSpace,
      createdAt: tp.task.createdAt,
      lastEditedDate: tp.task.lastEditedDate,
      requirements: tp.task.taskRequirements,
      progress: tp.task.taskProgresses,
      assignees: tp.task.userTasks.map(ut => ({
        userId: ut.user.id,
        name: ut.user.name,
        email: ut.user.email,
        status: ut.taskStatus,
        assignedAt: ut.createdDate,
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
    const {
      description,
      startDateTime,
      endDateTime,
      timeEstimateDay,
      timeEstimateHour,
      timeEstimateMinute,
      priority,
      importanceType,
      assignedToId
    } = validatedData;

    // Get project details to get workspace ID
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { workSpaceId: true }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Use transaction to create task and related records
    const result = await db.$transaction(async (prisma) => {
      // Create task
      const task = await prisma.task.create({
        data: {
          workSpaceId: project.workSpaceId,
          description,
          startDateTime: startDateTime ? new Date(startDateTime) : null,
          endDateTime: endDateTime ? new Date(endDateTime) : null,
          timeEstimateDay,
          timeEstimateHour,
          timeEstimateMinute,
          priority,
          importanceType,
          createdById: userId,
          assignedToId,
        },
      });

      // Create task-project relationship
      const taskProject = await prisma.taskProject.create({
        data: {
          taskId: task.id,
          projectId,
        },
      });

      // Create user-task relationship for the assignee
      let userTask = null;
      if (assignedToId) {
        userTask = await prisma.userTask.create({
          data: {
            taskId: task.id,
            usersId: assignedToId,
            taskStatus: 0, // todo
          },
        });
      }

      return { task, taskProject, userTask };
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
        workSpace: {
          select: {
            id: true,
            workSpaceTitle: true,
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
        taskRequirements: {
          orderBy: { order: 'asc' },
        },
        taskProgresses: {
          orderBy: { createdAt: 'desc' },
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
      description: taskWithDetails!.description,
      status: taskWithDetails!.status,
      priority: taskWithDetails!.priority,
      importanceType: taskWithDetails!.importanceType,
      startDateTime: taskWithDetails!.startDateTime,
      endDateTime: taskWithDetails!.endDateTime,
      timeEstimateDay: taskWithDetails!.timeEstimateDay,
      timeEstimateHour: taskWithDetails!.timeEstimateHour,
      timeEstimateMinute: taskWithDetails!.timeEstimateMinute,
      createdBy: taskWithDetails!.createdBy,
      assignedTo: taskWithDetails!.assignedTo,
      workSpace: taskWithDetails!.workSpace,
      createdAt: taskWithDetails!.createdAt,
      lastEditedDate: taskWithDetails!.lastEditedDate,
      requirements: taskWithDetails!.taskRequirements,
      progress: taskWithDetails!.taskProgresses,
      assignees: taskWithDetails!.userTasks.map(ut => ({
        userId: ut.user.id,
        name: ut.user.name,
        email: ut.user.email,
        status: ut.taskStatus,
        assignedAt: ut.createdDate,
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