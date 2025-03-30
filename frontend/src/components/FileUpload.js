import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Paper, Typography, LinearProgress } from '@mui/material';

function FileUpload({ onUpload }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true
  });

  return (
    <Paper
      {...getRootProps()}
      sx={{
        p: 3,
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
  );
}

export default FileUpload; 