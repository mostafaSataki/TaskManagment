'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar, 
  Clock, 
  User, 
  MoreHorizontal, 
  CheckCircle, 
  Circle, 
  AlertTriangle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { 
  TASK_STATUSES, 
  TASK_PRIORITY_LEVELS, 
  TASK_IMPORTANCE_LEVELS,
  getStatusLabel, 
  getStatusColor,
  getPriorityLabel, 
  getPriorityColor,
  getImportanceLabel, 
  getImportanceColor,
  formatTimeEstimate,
  calculateProgressPercentage,
  getAllowedStatusTransitions
} from '@/lib/task-status';

interface Task {
  id: string;
  description: string;
  status: number;
  priority: number;
  importanceType: number;
  startDateTime?: string;
  endDateTime?: string;
  timeEstimateDay?: number;
  timeEstimateHour?: number;
  timeEstimateMinute?: number;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  workSpace: {
    id: string;
    workSpaceTitle: string;
  };
  createdAt: string;
  lastEditedDate?: string;
  requirements: Array<{
    id: string;
    body: string;
    order: number;
    isDone: boolean;
  }>;
  progress: Array<{
    id: string;
    progress: number;
    description: string;
    userRole: number;
    endTime: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddRequirement: (taskId: string, body: string) => void;
  onToggleRequirement: (requirementId: string, isDone: boolean) => void;
  onAddProgress: (taskId: string, progress: number, description: string) => void;
}

export default function TaskCard({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  onAddRequirement,
  onToggleRequirement,
  onAddProgress
}: TaskCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [newRequirement, setNewRequirement] = useState('');
  const [progressInput, setProgressInput] = useState({ progress: 0, description: '' });
  const [showAddProgress, setShowAddProgress] = useState(false);

  const progressPercentage = calculateProgressPercentage(task.requirements);
  const isOverdue = task.endDateTime && new Date(task.endDateTime) < new Date();
  const allowedTransitions = getAllowedStatusTransitions(task.status);

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      onAddRequirement(task.id, newRequirement.trim());
      setNewRequirement('');
    }
  };

  const handleAddProgress = () => {
    if (progressInput.progress >= 0 && progressInput.progress <= 100) {
      onAddProgress(task.id, progressInput.progress, progressInput.description);
      setProgressInput({ progress: 0, description: '' });
      setShowAddProgress(false);
    }
  };

  const getStatusBadge = (status: number) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  );

  const getPriorityBadge = (priority: number) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
      {getPriorityLabel(priority)}
    </span>
  );

  const getImportanceBadge = (importance: number) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImportanceColor(importance)}`}>
      {getImportanceLabel(importance)}
    </span>
  );

  return (
    <Card className={`w-full ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
              {getImportanceBadge(task.importanceType)}
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
            <CardTitle className="text-base font-normal text-gray-900">
              {task.description}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Task Actions</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Change Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {allowedTransitions.map((transition) => (
                        <Button
                          key={transition.to}
                          variant="outline"
                          size="sm"
                          onClick={() => onStatusChange(task.id, transition.to)}
                        >
                          {transition.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onEdit(task)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => onDelete(task.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>
              {task.startDateTime 
                ? new Date(task.startDateTime).toLocaleDateString()
                : 'No start date'
              }
              {task.endDateTime && ` - ${new Date(task.endDateTime).toLocaleDateString()}`}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatTimeEstimate(task.timeEstimateDay, task.timeEstimateHour, task.timeEstimateMinute)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{task.assignedTo?.name || task.createdBy.name}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {task.requirements.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-600">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {new Date(task.createdAt).toLocaleDateString()}
            </span>
            <Avatar className="w-6 h-6">
              <AvatarImage src={task.createdBy.email} alt={task.createdBy.name} />
              <AvatarFallback className="text-xs">
                {task.createdBy.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* Requirements Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Requirements</h4>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add requirement..."
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    className="h-8 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddRequirement()}
                  />
                  <Button size="sm" onClick={handleAddRequirement}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {task.requirements.map((req) => (
                  <div key={req.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <button
                      onClick={() => onToggleRequirement(req.id, !req.isDone)}
                      className="flex-shrink-0"
                    >
                      {req.isDone ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${req.isDone ? 'line-through text-gray-500' : ''}`}>
                      {req.body}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Progress Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Progress Updates</h4>
                <Dialog open={showAddProgress} onOpenChange={setShowAddProgress}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Progress
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Progress Update</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Progress (%)</label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={progressInput.progress}
                          onChange={(e) => setProgressInput(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={progressInput.description}
                          onChange={(e) => setProgressInput(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe the progress made..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddProgress}>Add Progress</Button>
                        <Button variant="outline" onClick={() => setShowAddProgress(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {task.progress.map((prog) => (
                  <div key={prog.id} className="p-3 bg-blue-50 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{prog.progress}%</span>
                      <span className="text-xs text-gray-600">
                        {new Date(prog.endTime).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{prog.description}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Avatar className="w-4 h-4">
                        <AvatarFallback className="text-xs">
                          {prog.user.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600">{prog.user.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}