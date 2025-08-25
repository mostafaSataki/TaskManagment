import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getUserIdFromTokenSync } from '@/lib/auth/jwt';

// Validation schema for creating workspace
const createWorkspaceSchema = z.object({
  title: z.string().min(1, 'Workspace title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
});

// GET: Get user's workspaces
export async function GET(request: NextRequest) {
  try {
    // Get user ID from JWT token
    const userId = getUserIdFromTokenSync(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's workspaces through WorkSpaceUsers
    const workSpaceUsers = await db.workSpaceUser.findMany({
      where: { userId },
      include: {
        workSpace: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                projects: true,
                workSpaceUsers: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    // Extract workspaces from the results
    const workspaces = workSpaceUsers.map(wsu => ({
      id: wsu.workSpace.id,
      title: wsu.workSpace.title,
      description: wsu.workSpace.description,
      createdBy: wsu.workSpace.createdBy,
      createdAt: wsu.workSpace.createdAt,
      updatedAt: wsu.workSpace.updatedAt,
      userRole: {
        isOwner: wsu.isWorkSpaceOwner,
        isAdmin: wsu.isWorkSpaceAdmin,
        joinedAt: wsu.joinedAt,
      },
      stats: {
        projectsCount: wsu.workSpace._count.projects,
        membersCount: wsu.workSpace._count.workSpaceUsers,
      },
    }));

    return NextResponse.json(workspaces, { status: 200 });

  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new workspace
export async function POST(request: NextRequest) {
  try {
    // Get user ID from JWT token
    const userId = getUserIdFromTokenSync(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createWorkspaceSchema.parse(body);
    const { title, description } = validatedData;

    // Use transaction to create workspace and workspace user
    const result = await db.$transaction(async (prisma) => {
      // Create workspace
      const workspace = await prisma.workSpace.create({
        data: {
          title,
          description,
          createdById: userId,
        },
      });

      // Create workspace user with owner privileges
      const workspaceUser = await prisma.workSpaceUser.create({
        data: {
          workSpaceId: workspace.id,
          userId,
          isWorkSpaceOwner: true,
          isWorkSpaceAdmin: true,
        },
      });

      return { workspace, workspaceUser };
    });

    // Get the created workspace with user info
    const workspaceWithDetails = await db.workSpace.findUnique({
      where: { id: result.workspace.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            projects: true,
            workSpaceUsers: true,
          },
        },
      },
    });

    const response = {
      id: workspaceWithDetails!.id,
      title: workspaceWithDetails!.title,
      description: workspaceWithDetails!.description,
      createdBy: workspaceWithDetails!.createdBy,
      createdAt: workspaceWithDetails!.createdAt,
      updatedAt: workspaceWithDetails!.updatedAt,
      userRole: {
        isOwner: true,
        isAdmin: true,
        joinedAt: result.workspaceUser.joinedAt,
      },
      stats: {
        projectsCount: workspaceWithDetails!._count.projects,
        membersCount: workspaceWithDetails!._count.workSpaceUsers,
      },
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating workspace:', error);

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