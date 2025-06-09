const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// In-memory storage (replace with database in production)
const patients = [];

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'patient-service',
    timestamp: new Date().toISOString()
  });
});

// Get all patients
app.get('/api/patients', (req, res) => {
  res.json({
    success: true,
    data: patients,
    count: patients.length
  });
});

// Get patient by ID
app.get('/api/patients/:id', (req, res) => {
  const patient = patients.find(p => p.id === req.params.id);
  
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }
  
  res.json({
    success: true,
    data: patient
  });
});

// Create new patient
app.post('/api/patients', (req, res) => {
  const { name, email, phone, dateOfBirth, address } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required'
    });
  }
  
  const patient = {
    id: uuidv4(),
    name,
    email,
    phone: phone || null,
    dateOfBirth: dateOfBirth || null,
    address: address || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  patients.push(patient);
  
  res.status(201).json({
    success: true,
    data: patient,
    message: 'Patient created successfully'
  });
});

// Update patient
app.put('/api/patients/:id', (req, res) => {
  const patientIndex = patients.findIndex(p => p.id === req.params.id);
  
  if (patientIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }
  
  const { name, email, phone, dateOfBirth, address } = req.body;
  
  patients[patientIndex] = {
    ...patients[patientIndex],
    name: name || patients[patientIndex].name,
    email: email || patients[patientIndex].email,
    phone: phone || patients[patientIndex].phone,
    dateOfBirth: dateOfBirth || patients[patientIndex].dateOfBirth,
    address: address || patients[patientIndex].address,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: patients[patientIndex],
    message: 'Patient updated successfully'
  });
});

// Delete patient
app.delete('/api/patients/:id', (req, res) => {
  const patientIndex = patients.findIndex(p => p.id === req.params.id);
  
  if (patientIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }
  
  patients.splice(patientIndex, 1);
  
  res.json({
    success: true,
    message: 'Patient deleted successfully'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Patient Service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});