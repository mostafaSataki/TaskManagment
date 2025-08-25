import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromTokenSync } from '@/lib/auth/jwt';

// GET: Get users in a workspace
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
    const workspaceUser = await db.workSpaceUser.findFirst({
      where: {
        userId,
        workSpaceId,
      },
    });

    if (!workspaceUser) {
      return NextResponse.json(
        { error: 'Access denied to this workspace' },
        { status: 403 }
      );
    }

    // Get all users in this workspace
    const workspaceUsers = await db.workSpaceUser.findMany({
      where: {
        workSpaceId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    });

    // Format the response
    const users = workspaceUsers.map(wu => ({
      id: wu.user.id,
      name: wu.user.name,
      email: wu.user.email,
      isWorkSpaceAdmin: wu.isWorkSpaceAdmin,
      isWorkSpaceOwner: wu.isWorkSpaceOwner,
      userAlias: wu.userAlias,
    }));

    return NextResponse.json(users, { status: 200 });

  } catch (error) {
    console.error('Error fetching workspace users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}