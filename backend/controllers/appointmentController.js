// controllers/appointmentController.js
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

export const createAppointment = async (req, res) => {
  try {
    const { patientId, medecinId, date, heure, motif } = req.body;
    const appointment = await Appointment.create({
      patientId,
      medecinId,
      date,
      heure,
      motif,
      statut: "en_attente",
    });
    res.status(201).json({ message: "Rendez-vous créé", appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().populate("patientId medecinId");
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(id, { statut }, { new: true });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
