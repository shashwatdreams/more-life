import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Collapse,
  IconButton,
  LinearProgress
} from '@mui/material';
import Plot from 'react-plotly.js';
import axios from 'axios';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [failedFiles, setFailedFiles] = useState([]);
  const [expandedError, setExpandedError] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles.length) return;

    setLoading(true);
    setError(null);
    setFailedFiles([]);
    setExpandedError(false);
    setProcessingStatus('Starting file processing...');

    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData);
      setData(response.data);
      setUploadedFiles(response.data.processed_files || []);
      setFailedFiles(response.data.failed_files || []);
      setProcessingStatus('');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Unable to process the files. Please try again.';
      setError(errorMessage);
      setFailedFiles(err.response?.data?.failed_files || []);
      setProcessingStatus('');
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
          More Life
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
          Less Stress, More Life
        </Typography>

        <Paper
          {...getRootProps()}
          sx={{
            p: 3,
            mt: 4,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
          }}
        >
          <input {...getInputProps()} />
          <Typography>
            {isDragActive
              ? 'Drop the files here'
              : 'Drag and drop your bank statements here, or click to select'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Supported formats: PDF, CSV, Excel
          </Typography>
        </Paper>

        {loading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              {processingStatus}
            </Typography>
          </Box>
        )}

        {(uploadedFiles.length > 0 || failedFiles.length > 0) && (
          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              File Processing Status
            </Typography>
            
            {uploadedFiles.length > 0 && (
              <>
                <Typography variant="subtitle1" color="success.main" gutterBottom>
                  Successfully Processed Files
                </Typography>
                <List>
                  {uploadedFiles.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={file} />
                      <Chip label="Processed" color="success" size="small" />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 2 }} />
              </>
            )}

            {failedFiles.length > 0 && (
              <>
                <Typography variant="subtitle1" color="error.main" gutterBottom>
                  Files That Need Attention
                </Typography>
                <List>
                  {failedFiles.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={file.filename}
                        secondary={file.error}
                      />
                      <Chip label="Needs Attention" color="error" size="small" />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Paper>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ mt: 2 }}
            action={
              <IconButton
                aria-label="expand"
                size="small"
                onClick={() => setExpandedError(!expandedError)}
              >
                {expandedError ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            }
          >
            {error}
            <Collapse in={expandedError} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Tips for uploading bank statements:
                </Typography>
                <ul>
                  <li>Try downloading a fresh copy of your statement from your bank's website</li>
                  <li>Make sure the statement includes transaction dates, descriptions, and amounts</li>
                  <li>If using a PDF, ensure it's not password-protected</li>
                  <li>Check that the file is not corrupted or empty</li>
                  <li>Try converting the file to CSV format if available</li>
                </ul>
              </Box>
            </Collapse>
          </Alert>
        )}

        {data && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Income vs Expenses
                </Typography>
                <Plot
                  data={JSON.parse(data.income_expense_plot).data}
                  layout={{
                    ...JSON.parse(data.income_expense_plot).layout,
                    height: 400,
                    showlegend: true,
                  }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Expenses by Category
                </Typography>
                <Plot
                  data={JSON.parse(data.category_plot).data}
                  layout={{
                    ...JSON.parse(data.category_plot).layout,
                    height: 400,
                  }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Monthly Net Income/Expenses
                </Typography>
                <Plot
                  data={JSON.parse(data.monthly_plot).data}
                  layout={{
                    ...JSON.parse(data.monthly_plot).layout,
                    height: 400,
                    xaxis: { title: 'Month' },
                    yaxis: { title: 'Net Amount ($)' }
                  }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      Total Income: ${data.income_expense.income.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body1">
                      Total Expenses: ${data.income_expense.expenses.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1" color={data.income_expense.income - data.income_expense.expenses >= 0 ? 'success.main' : 'error.main'}>
                      Net Balance: ${(data.income_expense.income - data.income_expense.expenses).toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
}

export default App; 