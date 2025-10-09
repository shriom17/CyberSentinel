import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import {
  Description,
  CloudDownload,
  CheckCircle,
  Folder,
  Image,
  VideoLibrary,
  AudioFile,
  LocationOn,
  Timeline,
  Security,
  Gavel,
  AutoFixHigh
} from '@mui/icons-material';

interface EvidenceItem {
  id: string;
  type: 'photo' | 'video' | 'document' | 'audio' | 'location' | 'transaction' | 'communication';
  name: string;
  size: string;
  timestamp: string;
  hash: string;
  selected: boolean;
}

interface PackageMetadata {
  caseId: string;
  incidentDate: string;
  location: string;
  suspects: string[];
  officers: string[];
  description: string;
}

const EvidencePackageGenerator: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [packageGenerated, setPackageGenerated] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [evidence, setEvidence] = useState<EvidenceItem[]>([
    {
      id: '1',
      type: 'photo',
      name: 'ATM_Camera_Capture_001.jpg',
      size: '2.4 MB',
      timestamp: new Date().toISOString(),
      hash: 'sha256:a3f5d8c...',
      selected: true
    },
    {
      id: '2',
      type: 'video',
      name: 'Surveillance_Footage_12345.mp4',
      size: '145 MB',
      timestamp: new Date().toISOString(),
      hash: 'sha256:9b2e4f1...',
      selected: true
    },
    {
      id: '3',
      type: 'document',
      name: 'Transaction_Records.pdf',
      size: '856 KB',
      timestamp: new Date().toISOString(),
      hash: 'sha256:c7d8e2a...',
      selected: true
    },
    {
      id: '4',
      type: 'location',
      name: 'GPS_Location_Log.json',
      size: '124 KB',
      timestamp: new Date().toISOString(),
      hash: 'sha256:f4a9c3b...',
      selected: true
    },
    {
      id: '5',
      type: 'transaction',
      name: 'Banking_Transaction_Trail.csv',
      size: '2.1 MB',
      timestamp: new Date().toISOString(),
      hash: 'sha256:e8b7d4c...',
      selected: true
    },
    {
      id: '6',
      type: 'communication',
      name: 'SMS_Communication_Log.txt',
      size: '45 KB',
      timestamp: new Date().toISOString(),
      hash: 'sha256:d3c9f2e...',
      selected: true
    },
    {
      id: '7',
      type: 'audio',
      name: 'Voice_Recording_Interview.mp3',
      size: '8.7 MB',
      timestamp: new Date().toISOString(),
      hash: 'sha256:a1b8c5d...',
      selected: false
    }
  ]);

  const [metadata] = useState<PackageMetadata>({
    caseId: `CYBER-${Date.now()}`,
    incidentDate: new Date().toLocaleDateString(),
    location: 'Connaught Place, New Delhi',
    suspects: ['Unknown Suspect #1', 'Unknown Suspect #2'],
    officers: ['Officer Singh', 'Inspector Patel', 'Detective Sharma'],
    description: 'ATM Skimming and Card Cloning Investigation'
  });

  const steps = [
    'Select Evidence Items',
    'Verify Chain of Custody',
    'Generate Legal Report',
    'Package & Download'
  ];

  const toggleEvidence = (id: string) => {
    setEvidence(prev =>
      prev.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const generatePackage = () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate package generation
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setPackageGenerated(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      generatePackage();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const getIcon = (type: string) => {
    const icons = {
      photo: <Image color="primary" />,
      video: <VideoLibrary color="error" />,
      document: <Description color="action" />,
      audio: <AudioFile color="secondary" />,
      location: <LocationOn color="success" />,
      transaction: <Timeline color="warning" />,
      communication: <Security color="info" />
    };
    return icons[type as keyof typeof icons] || <Folder />;
  };

  const selectedCount = evidence.filter(e => e.selected).length;
  const totalSize = evidence
    .filter(e => e.selected)
    .reduce((acc, item) => {
      const size = parseFloat(item.size);
      const unit = item.size.split(' ')[1];
      const multiplier = unit === 'MB' ? 1 : unit === 'KB' ? 0.001 : 1;
      return acc + size * multiplier;
    }, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <Gavel sx={{ mr: 1, color: '#d32f2f' }} />
        ⚖️ AI Evidence Package Generator
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          🔐 This tool generates court-admissible evidence packages with automated chain of custody, 
          cryptographic verification, and legal compliance documentation.
        </Typography>
      </Alert>

      {/* Case Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>📋 Case Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2"><strong>Case ID:</strong> {metadata.caseId}</Typography>
              <Typography variant="body2"><strong>Incident Date:</strong> {metadata.incidentDate}</Typography>
              <Typography variant="body2"><strong>Location:</strong> {metadata.location}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2"><strong>Investigating Officers:</strong></Typography>
              {metadata.officers.map((officer, idx) => (
                <Chip key={idx} label={officer} size="small" sx={{ mr: 0.5, mt: 0.5 }} />
              ))}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {index === 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Select evidence items to include in the package
                      </Typography>
                      <List>
                        {evidence.map((item) => (
                          <ListItem
                            key={item.id}
                            secondaryAction={
                              <Checkbox
                                edge="end"
                                checked={item.selected}
                                onChange={() => toggleEvidence(item.id)}
                              />
                            }
                            sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}
                          >
                            <ListItemIcon>{getIcon(item.type)}</ListItemIcon>
                            <ListItemText
                              primary={item.name}
                              secondary={`${item.size} • ${new Date(item.timestamp).toLocaleString()} • ${item.hash}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Alert severity="success" sx={{ mt: 2 }}>
                        Selected: {selectedCount} items • Total: {totalSize.toFixed(2)} MB
                      </Alert>
                    </Box>
                  )}

                  {index === 1 && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Automated chain of custody verification
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon><CheckCircle sx={{ color: '#4caf50' }} /></ListItemIcon>
                          <ListItemText
                            primary="Cryptographic Hash Verification"
                            secondary="SHA-256 checksums validated for all files"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircle sx={{ color: '#4caf50' }} /></ListItemIcon>
                          <ListItemText
                            primary="Timestamp Authentication"
                            secondary="All evidence timestamps verified and logged"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircle sx={{ color: '#4caf50' }} /></ListItemIcon>
                          <ListItemText
                            primary="Officer Authentication"
                            secondary="Digital signatures from all handling officers"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckCircle sx={{ color: '#4caf50' }} /></ListItemIcon>
                          <ListItemText
                            primary="Metadata Integrity"
                            secondary="EXIF and metadata preserved with tamper detection"
                          />
                        </ListItem>
                      </List>
                    </Box>
                  )}

                  {index === 2 && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        AI-generated legal compliance report
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                        <Typography variant="subtitle2" gutterBottom>📄 Report Contents:</Typography>
                        <List dense>
                          <ListItem>• Executive Summary with AI-generated incident analysis</ListItem>
                          <ListItem>• Complete evidence inventory with cryptographic proofs</ListItem>
                          <ListItem>• Chain of custody documentation with timestamps</ListItem>
                          <ListItem>• Legal compliance checklist (IT Act 2000, CrPC)</ListItem>
                          <ListItem>• Evidence handling procedures and protocols</ListItem>
                          <ListItem>• Officer certification and digital signatures</ListItem>
                          <ListItem>• Forensic analysis summary and findings</ListItem>
                          <ListItem>• Court-admissible formatting per Indian Evidence Act</ListItem>
                        </List>
                      </Paper>
                      <Button
                        variant="outlined"
                        startIcon={<AutoFixHigh />}
                        sx={{ mt: 2 }}
                        onClick={() => setPreviewOpen(true)}
                      >
                        Preview Legal Report
                      </Button>
                    </Box>
                  )}

                  {index === 3 && (
                    <Box>
                      {!packageGenerated ? (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            Ready to generate evidence package
                          </Typography>
                          <Alert severity="warning" sx={{ mb: 2 }}>
                            This will create a tamper-proof, encrypted evidence package with:
                            <List dense>
                              <ListItem>• All selected evidence files</ListItem>
                              <ListItem>• Chain of custody documentation</ListItem>
                              <ListItem>• Legal compliance report</ListItem>
                              <ListItem>• Cryptographic verification manifest</ListItem>
                            </List>
                          </Alert>
                        </Box>
                      ) : (
                        <Box>
                          <Alert severity="success" sx={{ mb: 2 }}>
                            <Typography variant="h6">✅ Package Generated Successfully!</Typography>
                            <Typography variant="body2">
                              Evidence package is ready for download and court submission
                            </Typography>
                          </Alert>
                          <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>📦 Package Details:</Typography>
                            <Typography variant="body2">Package ID: {metadata.caseId}-PKG</Typography>
                            <Typography variant="body2">Total Size: {totalSize.toFixed(2)} MB (encrypted)</Typography>
                            <Typography variant="body2">Files Included: {selectedCount} items</Typography>
                            <Typography variant="body2">Generated: {new Date().toLocaleString()}</Typography>
                            <Typography variant="body2">Format: Encrypted ZIP with digital signature</Typography>
                          </Paper>
                          <Button
                            variant="contained"
                            startIcon={<CloudDownload />}
                            fullWidth
                            size="large"
                            onClick={() => alert('📥 Downloading evidence package...')}
                          >
                            Download Evidence Package
                          </Button>
                        </Box>
                      )}
                      
                      {isGenerating && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Generating package... {generationProgress}%
                          </Typography>
                          <LinearProgress variant="determinate" value={generationProgress} />
                        </Box>
                      )}
                    </Box>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={isGenerating}
                    >
                      {index === steps.length - 1 ? 'Generate Package' : 'Next'}
                    </Button>
                    <Button
                      disabled={index === 0 || isGenerating}
                      onClick={handleBack}
                      sx={{ ml: 1 }}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>📄 Legal Compliance Report Preview</DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 2, bgcolor: '#f9f9f9' }}>
            <Typography variant="h6" gutterBottom>EVIDENCE DOCUMENTATION REPORT</Typography>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>Case ID: {metadata.caseId}</Typography>
            <Typography variant="body2" paragraph>
              This report certifies that the enclosed digital evidence has been collected, 
              preserved, and documented in accordance with the Information Technology Act, 2000, 
              and the Indian Evidence Act, 1872.
            </Typography>

            <Typography variant="subtitle2" gutterBottom>1. EXECUTIVE SUMMARY</Typography>
            <Typography variant="body2" paragraph>
              Investigation into {metadata.description} occurring on {metadata.incidentDate} 
              at {metadata.location}. Evidence collected includes surveillance footage, 
              transaction records, and digital communications.
            </Typography>

            <Typography variant="subtitle2" gutterBottom>2. CHAIN OF CUSTODY</Typography>
            <Typography variant="body2" paragraph>
              All evidence items have been handled by authorized officers: {metadata.officers.join(', ')}.
              Each transfer has been logged with cryptographic timestamps and digital signatures.
            </Typography>

            <Typography variant="subtitle2" gutterBottom>3. FORENSIC INTEGRITY</Typography>
            <Typography variant="body2" paragraph>
              SHA-256 cryptographic hashes have been computed for all evidence files to ensure 
              no tampering or alteration. Original metadata has been preserved.
            </Typography>

            <Alert severity="info" sx={{ mt: 2 }}>
              This is a preview. Full report will be included in the evidence package.
            </Alert>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EvidencePackageGenerator;