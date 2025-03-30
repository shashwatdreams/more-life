import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Paper, Typography, LinearProgress, Box, Alert, List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function FileUpload({ onUploadStart, onUploadSuccess, onUploadError }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const onDrop = async (acceptedFiles) => {
    setFiles(acceptedFiles);
    setError(null);
    handleUpload(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true
  });

  const handleUpload = async (filesToUpload) => {
    setUploading(true);
    setUploadProgress(0);
    onUploadStart();

    try {
      const formData = new FormData();
      filesToUpload.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload files');
      }

      const data = await response.json();
      
      if (data.failed_files && data.failed_files.length > 0) {
        const errorMessages = data.failed_files.map(f => `${f.filename}: ${f.error}`).join('\n');
        setError(`Some files failed to process:\n${errorMessages}`);
      }

      onUploadSuccess(data);
    } catch (err) {
      setError(err.message);
      onUploadError(err.message);
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setError(null);
  };

  return (
    <Box>
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          mb: 2
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? 'Drop the files here'
            : 'Drag and drop your bank statements here'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to select files
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Supported formats: PDF, CSV, Excel
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {files.length > 0 && (
        <List>
          {files.map((file, index) => (
            <ListItem
              key={index}
              secondaryAction={
                !uploading && (
                  <IconButton edge="end" onClick={() => removeFile(index)}>
                    <DeleteIcon />
                  </IconButton>
                )
              }
            >
              <ListItemText
                primary={file.name}
                secondary={`${(file.size / 1024).toFixed(2)} KB`}
              />
            </ListItem>
          ))}
        </List>
      )}

      {uploading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Processing files...
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default FileUpload; 