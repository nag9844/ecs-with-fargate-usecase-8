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
const appointments = [];

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'appointment-service',
    timestamp: new Date().toISOString()
  });
});

// Get all appointments
app.get('/api/appointments', (req, res) => {
  res.json({
    success: true,
    data: appointments,
    count: appointments.length
  });
});

// Get appointment by ID
app.get('/api/appointments/:id', (req, res) => {
  const appointment = appointments.find(a => a.id === req.params.id);
  
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }
  
  res.json({
    success: true,
    data: appointment
  });
});

// Create new appointment
app.post('/api/appointments', (req, res) => {
  const { patientId, doctorName, appointmentDate, appointmentTime, reason } = req.body;
  
  if (!patientId || !doctorName || !appointmentDate || !appointmentTime) {
    return res.status(400).json({
      success: false,
      message: 'PatientId, doctorName, appointmentDate, and appointmentTime are required'
    });
  }
  
  const appointment = {
    id: uuidv4(),
    patientId,
    doctorName,
    appointmentDate,
    appointmentTime,
    reason: reason || null,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  appointments.push(appointment);
  
  res.status(201).json({
    success: true,
    data: appointment,
    message: 'Appointment created successfully'
  });
});

// Update appointment
app.put('/api/appointments/:id', (req, res) => {
  const appointmentIndex = appointments.findIndex(a => a.id === req.params.id);
  
  if (appointmentIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }
  
  const { patientId, doctorName, appointmentDate, appointmentTime, reason, status } = req.body;
  
  appointments[appointmentIndex] = {
    ...appointments[appointmentIndex],
    patientId: patientId || appointments[appointmentIndex].patientId,
    doctorName: doctorName || appointments[appointmentIndex].doctorName,
    appointmentDate: appointmentDate || appointments[appointmentIndex].appointmentDate,
    appointmentTime: appointmentTime || appointments[appointmentIndex].appointmentTime,
    reason: reason || appointments[appointmentIndex].reason,
    status: status || appointments[appointmentIndex].status,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: appointments[appointmentIndex],
    message: 'Appointment updated successfully'
  });
});

// Delete appointment
app.delete('/api/appointments/:id', (req, res) => {
  const appointmentIndex = appointments.findIndex(a => a.id === req.params.id);
  
  if (appointmentIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }
  
  appointments.splice(appointmentIndex, 1);
  
  res.json({
    success: true,
    message: 'Appointment deleted successfully'
  });
});

// Get appointments by patient ID
app.get('/api/appointments/patient/:patientId', (req, res) => {
  const patientAppointments = appointments.filter(a => a.patientId === req.params.patientId);
  
  res.json({
    success: true,
    data: patientAppointments,
    count: patientAppointments.length
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
  console.log(`Appointment Service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});