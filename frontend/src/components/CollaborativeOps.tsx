import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  AvatarGroup,
  TextField,
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip,
  Slide,
  Alert
} from '@mui/material';
import {
  Send,
  Person,
  Assignment,
  CheckCircle,
  RadioButtonUnchecked,
  Group,
  Chat,
  Notifications,
  ReportProblem,
  LocationOn,
  Timer
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';

interface Officer {
  id: string;
  name: string;
  role: string;
  status: 'available' | 'busy' | 'responding';
  location: string;
  avatar: string;
}

interface Incident {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: { lat: number; lng: number; address: string };
  timestamp: string;
  status: 'open' | 'assigned' | 'in-progress' | 'resolved';
  assignedOfficers: string[];
  tasks: Task[];
  messages: Message[];
  evidence: Evidence[];
}

interface Task {
  id: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueTime: string;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: 'text' | 'location' | 'evidence' | 'status';
}

interface Evidence {
  id: string;
  type: 'photo' | 'video' | 'document' | 'audio';
  filename: string;
  uploadedBy: string;
  timestamp: string;
  description: string;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface CollaborativeOpsProps {
  selectedAlert?: any;
}

const CollaborativeOps: React.FC<CollaborativeOpsProps> = ({ selectedAlert }) => {
  const [officers] = useState<Officer[]>([
    { id: '1', name: 'Officer Singh', role: 'Senior Inspector', status: 'available', location: 'CP Station', avatar: '👮‍♂️' },
    { id: '2', name: 'Inspector Patel', role: 'Cyber Crime', status: 'responding', location: 'Cyber Cell', avatar: '👩‍💼' },
    { id: '3', name: 'Constable Kumar', role: 'Field Officer', status: 'available', location: 'Beat 12', avatar: '👮' },
    { id: '4', name: 'Detective Sharma', role: 'Forensics', status: 'busy', location: 'Lab', avatar: '🔬' }
  ]);

  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isCommandCenter, setIsCommandCenter] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create incident from alert
  const createIncidentFromAlert = (alert: any) => {
    const incident: Incident = {
      id: `incident_${Date.now()}`,
      title: alert.type?.replace('_', ' ') || 'Cyber Crime Incident',
      severity: alert.risk_level || 'medium',
      location: {
        lat: alert.location?.lat || 0,
        lng: alert.location?.lng || 0,
        address: alert.location?.address || 'Unknown Location'
      },
      timestamp: new Date().toISOString(),
      status: 'open',
      assignedOfficers: [],
      tasks: [
        {
          id: '1',
          description: 'Secure the crime scene',
          assignedTo: '',
          status: 'pending',
          priority: 'high',
          dueTime: new Date(Date.now() + 30 * 60000).toISOString() // 30 min
        },
        {
          id: '2',
          description: 'Interview witnesses',
          assignedTo: '',
          status: 'pending',
          priority: 'medium',
          dueTime: new Date(Date.now() + 60 * 60000).toISOString() // 1 hour
        },
        {
          id: '3',
          description: 'Collect digital evidence',
          assignedTo: '',
          status: 'pending',
          priority: 'high',
          dueTime: new Date(Date.now() + 45 * 60000).toISOString() // 45 min
        }
      ],
      messages: [
        {
          id: '1',
          sender: 'System',
          content: `Incident created from alert: ${alert.message}`,
          timestamp: new Date().toISOString(),
          type: 'status'
        }
      ],
      evidence: []
    };
    setCurrentIncident(incident);
    setIsCommandCenter(true);
  };

  const assignOfficer = (taskId: string, officerId: string) => {
    if (!currentIncident) return;
    
    const officer = officers.find(o => o.id === officerId);
    if (!officer) return;

    setCurrentIncident(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === taskId 
            ? { ...task, assignedTo: officer.name, status: 'in-progress' }
            : task
        ),
        assignedOfficers: Array.from(new Set([...prev.assignedOfficers, officerId])),
        messages: [...prev.messages, {
          id: Date.now().toString(),
          sender: 'System',
          content: `${officer.name} assigned to task: ${prev.tasks.find(t => t.id === taskId)?.description}`,
          timestamp: new Date().toISOString(),
          type: 'status'
        }]
      };
    });
  };

  const sendMessage = () => {
    if (!chatMessage.trim() || !currentIncident) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'You',
      content: chatMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setCurrentIncident(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, newMessage]
      };
    });

    setChatMessage('');
  };

  const completeTask = (taskId: string) => {
    if (!currentIncident) return;

    setCurrentIncident(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === taskId 
            ? { ...task, status: 'completed' }
            : task
        ),
        messages: [...prev.messages, {
          id: Date.now().toString(),
          sender: 'System',
          content: `Task completed: ${prev.tasks.find(t => t.id === taskId)?.description}`,
          timestamp: new Date().toISOString(),
          type: 'status'
        }]
      };
    });
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: '#d32f2f',
      high: '#ff9800',
      medium: '#fbc02d',
      low: '#388e3c'
    };
    return colors[severity as keyof typeof colors] || '#666';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: '#4caf50',
      busy: '#ff9800',
      responding: '#f44336'
    };
    return colors[status as keyof typeof colors] || '#666';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: '#f44336',
      medium: '#ff9800',
      low: '#4caf50'
    };
    return colors[priority as keyof typeof colors] || '#666';
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentIncident?.messages]);

  useEffect(() => {
    if (selectedAlert && !currentIncident) {
      createIncidentFromAlert(selectedAlert);
    }
  }, [selectedAlert]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <Group sx={{ mr: 1, color: '#1976d2' }} />
        👥 Collaborative Operations Center
      </Typography>

      {/* Officer Status Dashboard */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>👮‍♂️ Officer Status</Typography>
          <List>
            {officers.map((officer) => (
              <ListItem key={officer.id}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: getStatusColor(officer.status) }}>
                    {officer.avatar}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={officer.name}
                  secondary={`${officer.role} • ${officer.location}`}
                />
                <Chip
                  label={officer.status.toUpperCase()}
                  size="small"
                  sx={{ bgcolor: getStatusColor(officer.status), color: 'white' }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>⚡ Quick Actions</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<ReportProblem />}
              color="error"
              onClick={() => selectedAlert && createIncidentFromAlert(selectedAlert)}
            >
              Create Incident
            </Button>
            <Button
              variant="outlined"
              startIcon={<Group />}
              onClick={() => setIsCommandCenter(true)}
            >
              Open Command Center
            </Button>
            <Button
              variant="outlined"
              startIcon={<Notifications />}
              onClick={() => alert('Broadcasting alert to all units...')}
            >
              Broadcast Alert
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Command Center Dialog */}
      <Dialog
        open={isCommandCenter}
        onClose={() => setIsCommandCenter(false)}
        maxWidth="lg"
        fullWidth
        TransitionComponent={Transition}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', bgcolor: '#1976d2', color: 'white' }}>
          <Assignment sx={{ mr: 1 }} />
          Command Center - {currentIncident?.title}
          {currentIncident && (
            <Chip
              label={currentIncident.severity.toUpperCase()}
              size="small"
              sx={{ ml: 2, bgcolor: getSeverityColor(currentIncident.severity), color: 'white' }}
            />
          )}
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {currentIncident && (
            <Box sx={{ display: 'flex', height: '70vh' }}>
              {/* Left Panel - Tasks & Officers */}
              <Box sx={{ width: '50%', borderRight: 1, borderColor: 'divider', p: 2 }}>
                <Typography variant="h6" gutterBottom>📋 Active Tasks</Typography>
                <List>
                  {currentIncident.tasks.map((task) => (
                    <ListItem key={task.id} sx={{ border: 1, borderColor: 'divider', mb: 1, borderRadius: 1 }}>
                      <ListItemIcon>
                        {task.status === 'completed' ? (
                          <CheckCircle sx={{ color: '#4caf50' }} />
                        ) : (
                          <RadioButtonUnchecked sx={{ color: getPriorityColor(task.priority) }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={task.description}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Assigned to: {task.assignedTo || 'Unassigned'}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Due: {new Date(task.dueTime).toLocaleTimeString()}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip label={task.priority} size="small" sx={{ bgcolor: getPriorityColor(task.priority), color: 'white' }} />
                              <Chip label={task.status} size="small" variant="outlined" />
                            </Box>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {!task.assignedTo && (
                          <AvatarGroup max={3}>
                            {officers.filter(o => o.status === 'available').map(officer => (
                              <Tooltip key={officer.id} title={`Assign to ${officer.name}`}>
                                <Avatar
                                  sx={{ cursor: 'pointer', width: 32, height: 32 }}
                                  onClick={() => assignOfficer(task.id, officer.id)}
                                >
                                  {officer.avatar}
                                </Avatar>
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        )}
                        {task.status !== 'completed' && task.assignedTo && (
                          <Button
                            size="small"
                            onClick={() => completeTask(task.id)}
                            startIcon={<CheckCircle />}
                          >
                            Complete
                          </Button>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* Right Panel - Communication */}
              <Box sx={{ width: '50%', p: 2, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>💬 Team Communication</Typography>
                
                {/* Messages */}
                <Box sx={{ flexGrow: 1, border: 1, borderColor: 'divider', borderRadius: 1, p: 1, overflow: 'auto', mb: 2 }}>
                  {currentIncident.messages.map((message) => (
                    <Box key={message.id} sx={{ mb: 1, p: 1, borderRadius: 1, bgcolor: message.sender === 'System' ? '#f5f5f5' : '#e3f2fd' }}>
                      <Typography variant="caption" color="textSecondary">
                        {message.sender} • {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                      <Typography variant="body2">{message.content}</Typography>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <IconButton onClick={sendMessage} color="primary">
                    <Send />
                  </IconButton>
                </Box>

                {/* Quick Actions */}
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button size="small" startIcon={<LocationOn />} onClick={() => setChatMessage('📍 Requesting location update')}>
                    Location
                  </Button>
                  <Button size="small" startIcon={<Timer />} onClick={() => setChatMessage('⏰ ETA requested')}>
                    ETA
                  </Button>
                  <Button size="small" startIcon={<ReportProblem />} onClick={() => setChatMessage('🚨 Backup requested')}>
                    Backup
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setIsCommandCenter(false)}>Close</Button>
          <Button variant="contained" onClick={() => alert('Incident report generated!')}>
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Emergency Button */}
      <Fab
        color="error"
        aria-label="emergency"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => alert('Emergency broadcast sent to all units!')}
      >
        <Badge badgeContent={currentIncident?.tasks.filter(t => t.status !== 'completed').length || 0} color="secondary">
          <ReportProblem />
        </Badge>
      </Fab>
    </Box>
  );
};

export default CollaborativeOps;