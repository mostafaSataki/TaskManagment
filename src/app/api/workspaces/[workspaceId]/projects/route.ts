import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserIdFromTokenSync } from '@/lib/auth/jwt';

// Validation schema for creating project
const createProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Helper function to check if user has access to workspace
async function checkWorkspaceAccess(userId: string, workspaceId: string) {
  const workspaceUser = await db.workSpaceUser.findFirst({
    where: {
      userId,
      workSpaceId: workspaceId,
    },
  });

  return workspaceUser !== null;
}

// GET: Get projects for a specific workspace
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
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

    const { workspaceId } = await params;

    // Check if user has access to this workspace
    const hasAccess = await checkWorkspaceAccess(userId, workspaceId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this workspace' },
        { status: 403 }
      );
    }

    // Get projects for the workspace
    const projects = await db.project.findMany({
      where: { workSpaceId: workspaceId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        workSpace: {
          select: {
            id: true,
            title: true,
          },
        },
        userProjects: {
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
        _count: {
          select: {
            tasks: true,
            userProjects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const formattedProjects = projects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      createdBy: project.createdBy,
      workSpace: project.workSpace,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      stats: {
        tasksCount: project._count.tasks,
        membersCount: project._count.userProjects,
      },
      members: project.userProjects.map(up => ({
        userId: up.user.id,
        name: up.user.name,
        email: up.user.email,
        isProjectManager: up.isProjectManager,
        joinedAt: up.joinedAt,
      })),
    }));

    return NextResponse.json(formattedProjects, { status: 200 });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new project in a workspace
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
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

    const { workspaceId } = await params;

    // Check if user has access to this workspace
    const hasAccess = await checkWorkspaceAccess(userId, workspaceId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this workspace' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);
    const { title, description, startDate, endDate } = validatedData;

    // Use transaction to create project and user project
    const result = await db.$transaction(async (prisma) => {
      // Create project
      const project = await prisma.project.create({
        data: {
          title,
          description,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          workSpaceId: workspaceId,
          createdById: userId,
        },
      });

      // Create user project with manager privileges
      const userProject = await prisma.userProject.create({
        data: {
          projectId: project.id,
          userId,
          isProjectManager: true,
        },
      });

      return { project, userProject };
    });

    // Get the created project with full details
    const projectWithDetails = await db.project.findUnique({
      where: { id: result.project.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        workSpace: {
          select: {
            id: true,
            title: true,
          },
        },
        userProjects: {
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
        _count: {
          select: {
            tasks: true,
            userProjects: true,
          },
        },
      },
    });

    const response = {
      id: projectWithDetails!.id,
      title: projectWithDetails!.title,
      description: projectWithDetails!.description,
      startDate: projectWithDetails!.startDate,
      endDate: projectWithDetails!.endDate,
      createdBy: projectWithDetails!.createdBy,
      workSpace: projectWithDetails!.workSpace,
      createdAt: projectWithDetails!.createdAt,
      updatedAt: projectWithDetails!.updatedAt,
      stats: {
        tasksCount: projectWithDetails!._count.tasks,
        membersCount: projectWithDetails!._count.userProjects,
      },
      members: projectWithDetails!.userProjects.map(up => ({
        userId: up.user.id,
        name: up.user.name,
        email: up.user.email,
        isProjectManager: up.isProjectManager,
        joinedAt: up.joinedAt,
      })),
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating project:', error);

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